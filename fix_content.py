#!/usr/bin/env python3
"""
SQLQuest Content Sanitizer
Execute na raiz do projeto: python fix_content.py

Tarefas executadas:
  1. Corrige xpTotal (soma exata dos xpReward de todas as etapas)
  2. Valida e documenta a ordem sequencial das trilhas (1-23)
  3. Integra 6 arquivos Gemini orfãos em suas trilhas-alvo
  4. Corrige estrutura de 08-subqueries (duplicatas + etapas fora de ordem)
  5. Adiciona intro/conclusao temáticas nas trilhas que estão sem
"""

import json
import sys
from pathlib import Path
from collections import defaultdict

sys.stdout.reconfigure(encoding="utf-8")

TRILHAS_DIR = Path("content/trilhas/core")

# ─── Mapeamento: arquivo orfão → trilha alvo ────────────────────────────────
# consultas_avancadas-161-164 já está dentro de 08-subqueries (ordens 161-164)
# A correção do 08-subqueries reorganiza essas etapas automaticamente.
ORPHAN_MAP = [
    # (arquivo_solto,                                   trilha_alvo)
    ("content/trilhas/advanced/arquitetura_avancada-177-180.json",      "12-views.json"),
    ("content/trilhas/advanced/operacoes_conjunto-165-168.json",        "09-ctes.json"),
    ("content/trilhas/advanced/operacoes_conjunto-169-172.json",        "09-ctes.json"),
    ("content/trilhas/advanced/seguranca_transacional-173-176.json",    "18-transacoes.json"),
    ("content/trilhas/advanced/performance_otimizacao-181-184.json",    "21-elite-tuning-performance.json"),
    ("content/trilhas/advanced/performance_otimizacao-185-188.json",    "21-elite-tuning-performance.json"),
]

# ─── Trilhas que precisam de intro / conclusao ──────────────────────────────
NEEDS_INTRO    = {"00-fundamentos.json", "02-filtragem.json", "02-manipulacao-dados.json",
                  "06-joins.json", "08-subqueries.json", "11-dml.json"}
NEEDS_CONCLUSAO = {"00-fundamentos.json", "02-manipulacao-dados.json",
                   "06-joins.json", "19-constraints.json"}

# ─── Mensagens de conclusao por slug ───────────────────────────────────────
CONCLUSAO_MSGS = {
    "fundamentos": (
        "Você construiu a base! Agora conhece a estrutura de um banco relacional "
        "e está pronto para escrever consultas cada vez mais poderosas.",
        "Foundation built! You now understand relational database structure "
        "and are ready to write increasingly powerful queries.",
        "¡Base construida! Ahora conoces la estructura de una base de datos relacional "
        "y estás listo para escribir consultas cada vez más poderosas.",
    ),
    "manipulacao-dados": (
        "Excelente! Você dominou a leitura e projeção de dados com SELECT. "
        "Seu repertório SQL está crescendo a passos largos!",
        "Excellent! You mastered reading and projecting data with SELECT. "
        "Your SQL repertoire is growing fast!",
        "¡Excelente! Dominaste la lectura y proyección de datos con SELECT. "
        "¡Tu repertorio SQL está creciendo a pasos agigantados!",
    ),
    "filtragem": (
        "Missão cumprida! Agora você sabe filtrar, comparar e combinar condições "
        "com WHERE — uma das habilidades mais usadas no dia a dia.",
        "Mission accomplished! Now you know how to filter, compare, and combine "
        "conditions with WHERE — one of the most used skills day to day.",
        "¡Misión cumplida! Ahora sabes filtrar, comparar y combinar condiciones "
        "con WHERE — una de las habilidades más usadas en el día a día.",
    ),
    "joins": (
        "Parabéns! Você aprendeu a unir tabelas e enxergar dados de múltiplas fontes "
        "como um verdadeiro arquiteto de consultas.",
        "Congratulations! You learned to join tables and see data from multiple sources "
        "like a true query architect.",
        "¡Felicidades! Aprendiste a unir tablas y ver datos de múltiples fuentes "
        "como un verdadero arquitecto de consultas.",
    ),
    "constraints": (
        "Banco protegido! Você aprendeu a usar constraints para blindar seus dados "
        "contra inconsistências. Um banco robusto começa aqui.",
        "Database protected! You learned to use constraints to shield your data "
        "against inconsistencies. A robust database starts here.",
        "¡Base de datos protegida! Aprendiste a usar constraints para blindar tus datos "
        "contra inconsistencias. Una base de datos robusta empieza aquí.",
    ),
}

# ─── Utilitários ────────────────────────────────────────────────────────────

def load_json(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(path: Path, data: dict):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def renumber(etapas: list) -> list:
    """Renumera as etapas sequencialmente a partir de 1."""
    for i, e in enumerate(etapas, 1):
        e["ordem"] = i
    return etapas

def split_tail(etapas: list):
    """Separa corpo (conteúdo) do rodapé (resumo + conclusao)."""
    body = [e for e in etapas if e.get("tipo") not in ("resumo", "conclusao")]
    tail = sorted(
        [e for e in etapas if e.get("tipo") in ("resumo", "conclusao")],
        key=lambda e: 0 if e.get("tipo") == "resumo" else 1,
    )
    return body, tail

def fix_xp(trilha: dict) -> dict:
    """Recalcula xpTotal como soma exata dos xpReward das etapas."""
    trilha["xpTotal"] = sum(e.get("xpReward", 0) for e in trilha.get("etapas", []))
    return trilha

# ─── Task 3-A: Correção especial do 08-subqueries ───────────────────────────

def fix_08_subqueries(trilha: dict) -> dict:
    """
    08-subqueries tem dois problemas estruturais:
      • Ordens 9-12 duplicadas (dois blocos idênticos de texto+exercícios)
      • Etapas 161-164 (de consultas_avancadas) posicionadas DEPOIS de resumo/conclusao

    Solução:
      1. Deduplica pelo valor de `ordem` (mantém primeira ocorrência)
      2. Separa corpo de rodapé (resumo/conclusao)
      3. Ordena o corpo por `ordem` → 1-18 vêm antes de 161-164
      4. Renumera tudo de 1..N
    """
    etapas = trilha["etapas"]
    body, tail = split_tail(etapas)

    seen = set()
    deduped = []
    for e in body:
        key = e.get("ordem")
        if key not in seen:
            seen.add(key)
            deduped.append(e)

    deduped.sort(key=lambda e: e.get("ordem", 0))
    trilha["etapas"] = renumber(deduped + tail)
    trilha["totalEtapas"] = len(trilha["etapas"])
    return trilha

# ─── Task 3-B: Integração dos arquivos orfãos ────────────────────────────────

def integrate_orphan(trilha: dict, loose_path: Path) -> dict:
    """
    Lê etapas_formato_app do arquivo Gemini e insere no corpo da trilha,
    imediatamente antes de resumo/conclusao.
    """
    loose = load_json(loose_path)
    new_etapas = loose.get("etapas_formato_app", [])
    if not new_etapas:
        print(f"    ⚠️  Nenhuma etapa em {loose_path.name}")
        return trilha

    body, tail = split_tail(trilha["etapas"])
    trilha["etapas"] = renumber(body + new_etapas + tail)
    trilha["totalEtapas"] = len(trilha["etapas"])
    return trilha

# ─── Task 4: Adicionar intro / conclusao ────────────────────────────────────

def add_intro_if_missing(trilha: dict) -> dict:
    etapas = trilha["etapas"]
    if any(e.get("tipo") == "intro" for e in etapas):
        return trilha

    slug    = trilha.get("slug", "")
    titulo  = trilha.get("titulo", slug)
    icone   = trilha.get("icone", "📚")
    descr   = trilha.get("descricao", "")
    tr      = trilha.get("traducoes", {})

    titulo_en = tr.get("en", {}).get("titulo", titulo)
    titulo_es = tr.get("es", {}).get("titulo", titulo)
    descr_en  = tr.get("en", {}).get("descricao", descr)
    descr_es  = tr.get("es", {}).get("descricao", descr)

    intro = {
        "ordem": 0,
        "tipo": "intro",
        "temAnuncio": False,
        "xpReward": 0,
        "titulo": titulo,
        "conteudo": {"emoji": icone, "subtitulo": descr},
        "traducoes": {
            "en": {"titulo": titulo_en, "conteudo": {"subtitulo": descr_en}},
            "es": {"titulo": titulo_es, "conteudo": {"subtitulo": descr_es}},
        },
    }
    trilha["etapas"] = renumber([intro] + etapas)
    trilha["totalEtapas"] = len(trilha["etapas"])
    print(f"    ➕ intro adicionada")
    return trilha


def add_conclusao_if_missing(trilha: dict) -> dict:
    etapas = trilha["etapas"]
    if any(e.get("tipo") == "conclusao" for e in etapas):
        return trilha

    slug      = trilha.get("slug", "")
    titulo    = trilha.get("titulo", slug)
    xp_ganho  = sum(e.get("xpReward", 0) for e in etapas)   # XP atual antes de +50
    tr_root   = trilha.get("traducoes", {})
    titulo_en = tr_root.get("en", {}).get("titulo", titulo)
    titulo_es = tr_root.get("es", {}).get("titulo", titulo)

    msgs = CONCLUSAO_MSGS.get(slug)
    if msgs:
        msg_pt, msg_en, msg_es = msgs
    else:
        msg_pt = f"Parabéns! Você concluiu '{titulo}'. Continue avançando no SQLQuest!"
        msg_en = f"Congratulations! You completed '{titulo_en}'. Keep advancing in SQLQuest!"
        msg_es = f"¡Felicidades! Completaste '{titulo_es}'. ¡Sigue avanzando en SQLQuest!"

    conclusao = {
        "ordem": 0,
        "tipo": "conclusao",
        "temAnuncio": False,
        "xpReward": 50,
        "titulo": "Trilha Concluída!",
        "conteudo": {"mensagem": msg_pt, "xpGanho": xp_ganho},
        "traducoes": {
            "en": {"titulo": "Trail Complete!",
                   "conteudo": {"mensagem": msg_en, "xpGanho": xp_ganho}},
            "es": {"titulo": "¡Ruta Completada!",
                   "conteudo": {"mensagem": msg_es, "xpGanho": xp_ganho}},
        },
    }

    body, tail = split_tail(etapas)
    # tail pode ter apenas resumo (sem conclusao) — inserimos conclusao após ele
    trilha["etapas"] = renumber(body + tail + [conclusao])
    trilha["totalEtapas"] = len(trilha["etapas"])
    print(f"    ➕ conclusao adicionada")
    return trilha

# ─── Função principal ────────────────────────────────────────────────────────

def main():
    orphan_by_target: dict[str, list[Path]] = defaultdict(list)
    for loose_str, target in ORPHAN_MAP:
        orphan_by_target[target].append(Path(loose_str))

    files = sorted(TRILHAS_DIR.glob("*.json"))
    print(f"\n🌱 SQLQuest Content Sanitizer — {len(files)} trilhas\n{'─'*55}")

    for trilha_file in files:
        print(f"\n📁 {trilha_file.name}")
        data = load_json(trilha_file)
        n_before = len(data.get("etapas", []))

        # ── Correção especial: duplicatas e posição em 08-subqueries ──────
        if trilha_file.name == "08-subqueries.json":
            print("  🔧 Corrigindo duplicatas e posição das etapas 161-164")
            data = fix_08_subqueries(data)

        # ── Task 3: Integrar arquivos orfãos ──────────────────────────────
        for loose_path in orphan_by_target.get(trilha_file.name, []):
            print(f"  📥 Integrando {loose_path.name}")
            data = integrate_orphan(data, loose_path)

        # ── Task 4a: Adicionar intro se ausente ───────────────────────────
        if trilha_file.name in NEEDS_INTRO:
            data = add_intro_if_missing(data)

        # ── Task 4b: Adicionar conclusao se ausente ───────────────────────
        if trilha_file.name in NEEDS_CONCLUSAO:
            data = add_conclusao_if_missing(data)

        # ── Task 1: Corrigir xpTotal (sempre, após todas as mudanças) ─────
        old_xp = data.get("xpTotal", 0)
        data   = fix_xp(data)
        new_xp = data["xpTotal"]
        if old_xp != new_xp:
            print(f"  💰 xpTotal: {old_xp} → {new_xp}")

        n_after = len(data.get("etapas", []))
        if n_after != n_before:
            print(f"  📊 etapas: {n_before} → {n_after}")

        save_json(trilha_file, data)
        print(f"  ✅ {n_after} etapas  |  {new_xp} XP total")

    # ── Task 2: Validar sequência de ordens das trilhas ───────────────────
    print(f"\n{'─'*55}\n📋 Ordem das trilhas (validação):\n")
    all_ordens = []
    for trilha_file in files:
        d = load_json(trilha_file)
        all_ordens.append((d.get("ordem", 0), d.get("slug", "?"), trilha_file.name))

    all_ordens.sort()
    for ordem, slug, fname in all_ordens:
        print(f"  {str(ordem).rjust(2)}  {slug:<35}  {fname}")

    ordens_nums = [o for o, _, _ in all_ordens]
    gaps = [ordens_nums[i+1] - ordens_nums[i] for i in range(len(ordens_nums)-1)]
    if all(g == 1 for g in gaps) and ordens_nums[0] == 1:
        print(f"\n  ✅ Sequência perfeita: 1 a {ordens_nums[-1]}, sem buracos.")
    else:
        print(f"\n  ⚠️  Sequência com problemas. Gaps: {gaps}")

    print(f"\n✨ Saneamento concluído!")


if __name__ == "__main__":
    main()
