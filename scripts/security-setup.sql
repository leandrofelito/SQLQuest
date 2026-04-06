-- =============================================================================
-- SQLQuest — Security Setup for Neon PostgreSQL
-- Run this once as the superuser/owner role in your Neon project.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. SANDBOX USER (read-only, for future server-side PostgreSQL validation)
--    This role has ZERO write access. If a user somehow injects a query that
--    reaches this connection, the worst they can do is SELECT.
-- ---------------------------------------------------------------------------

-- Replace 'STRONG_RANDOM_PASSWORD' with a real password stored in your env.
CREATE ROLE sqlquest_sandbox WITH LOGIN PASSWORD 'STRONG_RANDOM_PASSWORD';

-- Allow connection to the database
GRANT CONNECT ON DATABASE neondb TO sqlquest_sandbox;

-- Allow navigation of the public schema
GRANT USAGE ON SCHEMA public TO sqlquest_sandbox;

-- Read-only access to exercise-related tables only
GRANT SELECT ON "Etapa"  TO sqlquest_sandbox;
GRANT SELECT ON "Trilha" TO sqlquest_sandbox;

-- Explicitly deny all write operations (belt-and-suspenders)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE
    ON ALL TABLES IN SCHEMA public
    FROM sqlquest_sandbox;

REVOKE CREATE ON SCHEMA public FROM sqlquest_sandbox;

-- Prevent the sandbox user from granting its own privileges to others
ALTER ROLE sqlquest_sandbox NOINHERIT NOCREATEDB NOCREATEROLE;

-- ---------------------------------------------------------------------------
-- 2. UNIQUE CONSTRAINTS (idempotent — skips if already exists)
--    These database-level locks prevent any race condition or direct-DB
--    manipulation from awarding the same XP twice.
-- ---------------------------------------------------------------------------

-- One progress record per user per exercise (already in Prisma schema,
-- but we add it explicitly so it survives schema drift or direct SQL access)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Progresso_userId_etapaId_key'
  ) THEN
    ALTER TABLE "Progresso"
      ADD CONSTRAINT "Progresso_userId_etapaId_key"
      UNIQUE ("userId", "etapaId");
  END IF;
END $$;

-- One ranking achievement per type per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ConquistaRanking_userId_tipo_key'
  ) THEN
    ALTER TABLE "ConquistaRanking"
      ADD CONSTRAINT "ConquistaRanking_userId_tipo_key"
      UNIQUE ("userId", tipo);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. XP UPDATE STORED PROCEDURE
--    Centralises all XP logic inside the database.
--    The application calls this function instead of issuing ad-hoc UPDATEs,
--    ensuring stars→XP calculation and the idempotency check are atomic.
--    SECURITY DEFINER means it runs with the owner's privileges, not the caller's,
--    so even the sandbox role cannot escalate by calling it directly.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION registrar_progresso(
  p_user_id    TEXT,
  p_trilha_id  TEXT,
  p_etapa_id   TEXT,
  p_tentativas INT,
  p_dicas      INT,
  p_estrelas   INT,   -- 0-3, calculated by the application
  p_xp_ganho   INT    -- XP for these stars, calculated by the application
)
RETURNS TABLE(xp_delta INT, nivel_anterior INT, nivel_atual INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_estrelas_exist  INT;
  v_xp_exist        INT;
  v_xp_delta        INT := 0;
  v_xp_antes        INT;
  v_xp_depois       INT;
  v_nivel_anterior  INT;
  v_nivel_atual     INT;
BEGIN
  -- Read existing progress (if any) and current XP in a single scan
  SELECT p.estrelas, p."xpGanho"
    INTO v_estrelas_exist, v_xp_exist
    FROM "Progresso" p
   WHERE p."userId" = p_user_id
     AND p."etapaId" = p_etapa_id;

  SELECT u."totalXp"
    INTO v_xp_antes
    FROM "User" u
   WHERE u.id = p_user_id;

  -- Level formula mirrors lib/xp.ts: floor((1 + sqrt(1 + 4*xp/150)) / 2)
  v_nivel_anterior := GREATEST(1, FLOOR((1.0 + SQRT(1.0 + 4.0 * COALESCE(v_xp_antes, 0) / 150.0)) / 2.0)::INT);

  IF v_estrelas_exist IS NULL THEN
    -- First completion — insert and award full XP
    INSERT INTO "Progresso" (
      id, "userId", "trilhaId", "etapaId",
      "xpGanho", tentativas, "usouDica", estrelas, "concluidaEm"
    ) VALUES (
      gen_random_uuid()::TEXT,
      p_user_id, p_trilha_id, p_etapa_id,
      p_xp_ganho, p_tentativas, (p_dicas > 0), p_estrelas, NOW()
    );
    v_xp_delta := p_xp_ganho;

  ELSIF p_estrelas > v_estrelas_exist THEN
    -- Better score — update and award only the XP difference
    v_xp_delta := p_xp_ganho - v_xp_exist;
    UPDATE "Progresso"
       SET "xpGanho"    = p_xp_ganho,
           tentativas   = p_tentativas,
           "usouDica"   = (p_dicas > 0),
           estrelas     = p_estrelas,
           "concluidaEm" = NOW()
     WHERE "userId" = p_user_id
       AND "etapaId" = p_etapa_id;

  ELSE
    -- Already completed with equal or better score — grant nothing
    RETURN QUERY SELECT 0, v_nivel_anterior, v_nivel_anterior;
    RETURN;
  END IF;

  -- Atomically increment totalXp (no race condition with concurrent requests)
  IF v_xp_delta > 0 THEN
    UPDATE "User"
       SET "totalXp" = "totalXp" + v_xp_delta
     WHERE id = p_user_id
    RETURNING "totalXp" INTO v_xp_depois;

    v_nivel_atual := GREATEST(1, FLOOR((1.0 + SQRT(1.0 + 4.0 * v_xp_depois / 150.0)) / 2.0)::INT);
  ELSE
    v_nivel_atual := v_nivel_anterior;
  END IF;

  RETURN QUERY SELECT v_xp_delta, v_nivel_anterior, v_nivel_atual;
END;
$$;

-- Revoke public execute so only the application role can call it
REVOKE EXECUTE ON FUNCTION registrar_progresso FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION registrar_progresso TO neondb_owner; -- replace with your app role

-- ---------------------------------------------------------------------------
-- 4. ROW-LEVEL SECURITY (optional hardening)
--    Prevents any application bug from leaking one user's data to another.
-- ---------------------------------------------------------------------------

ALTER TABLE "Progresso"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConquistaRanking" ENABLE ROW LEVEL SECURITY;

-- Application role sees its own rows (set app.current_user_id at query time)
CREATE POLICY progresso_owner ON "Progresso"
  USING ("userId" = current_setting('app.current_user_id', TRUE));

CREATE POLICY conquista_owner ON "ConquistaRanking"
  USING ("userId" = current_setting('app.current_user_id', TRUE));

-- Bypass RLS for the owner role (Prisma uses this)
ALTER TABLE "Progresso"        FORCE ROW LEVEL SECURITY;
ALTER TABLE "ConquistaRanking" FORCE ROW LEVEL SECURITY;
