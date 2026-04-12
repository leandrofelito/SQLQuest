/**
 * Cache persistente (IndexedDB) para offline-first no WebView / navegador.
 * Não armazena tokens de sessão — apenas snapshots já retornados pelas APIs autenticadas.
 */

const DB_NAME = 'sqlquest-offline'
const DB_VERSION = 1
const STORE = 'kv'

const USER_HINT_KEY = 'sqlquest_offline_user_key'

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
  })
}

async function idbGetRaw(key: string): Promise<unknown | null> {
  const db = await idbOpen()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const getReq = tx.objectStore(STORE).get(key)
    getReq.onerror = () => reject(getReq.error)
    getReq.onsuccess = () => resolve(getReq.result ?? null)
  })
}

async function idbSetRaw(key: string, value: unknown): Promise<void> {
  const db = await idbOpen()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.objectStore(STORE).put(value, key)
  })
}

async function idbDeleteRaw(key: string): Promise<void> {
  const db = await idbOpen()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.objectStore(STORE).delete(key)
  })
}

export function isOfflineCacheSupported(): boolean {
  return typeof indexedDB !== 'undefined'
}

export function setOfflineUserKeyHint(userKey: string): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(USER_HINT_KEY, userKey)
  } catch {
    /* ignore */
  }
}

export function getOfflineUserKeyHint(): string {
  try {
    if (typeof localStorage === 'undefined') return 'anon'
    return localStorage.getItem(USER_HINT_KEY) || 'anon'
  } catch {
    return 'anon'
  }
}

export function clearOfflineUserKeyHint(): void {
  try {
    localStorage.removeItem(USER_HINT_KEY)
  } catch {
    /* ignore */
  }
}

export type TrilhasIdbEnvelope = {
  v: 1
  userKey: string
  contentVersion: string
  data: unknown
  savedAt: number
}

export type ProgressoIdbEnvelope = {
  v: 1
  userKey: string
  data: unknown
  savedAt: number
}

export type EtapaIdbEnvelope = {
  v: 1
  contentVersion: string
  data: unknown
  savedAt: number
}

function trilhasKey(lang: string, userKey: string) {
  return `trilhas:${lang}:${userKey}`
}

function progressoKey(userKey: string) {
  return `progresso:${userKey}`
}

function etapaKey(id: string, lang: string) {
  return `etapa:${id}:${lang}`
}

export async function idbGetTrilhas(
  lang: string,
  userKey: string,
  expectedContentVersion: string | null,
): Promise<TrilhasIdbEnvelope | null> {
  if (!isOfflineCacheSupported()) return null
  try {
    const raw = await idbGetRaw(trilhasKey(lang, userKey))
    if (!raw || typeof raw !== 'object') return null
    const env = raw as TrilhasIdbEnvelope
    if (env.v !== 1 || env.userKey !== userKey) return null
    if (expectedContentVersion !== null && env.contentVersion !== expectedContentVersion) return null
    return env
  } catch {
    return null
  }
}

export async function idbSetTrilhas(
  lang: string,
  userKey: string,
  contentVersion: string,
  data: unknown,
): Promise<void> {
  if (!isOfflineCacheSupported()) return
  const env: TrilhasIdbEnvelope = {
    v: 1,
    userKey,
    contentVersion,
    data,
    savedAt: Date.now(),
  }
  await idbSetRaw(trilhasKey(lang, userKey), env)
  setOfflineUserKeyHint(userKey)
}

export async function idbGetProgresso(userKey: string): Promise<ProgressoIdbEnvelope | null> {
  if (!isOfflineCacheSupported()) return null
  try {
    const raw = await idbGetRaw(progressoKey(userKey))
    if (!raw || typeof raw !== 'object') return null
    const env = raw as ProgressoIdbEnvelope
    if (env.v !== 1 || env.userKey !== userKey) return null
    return env
  } catch {
    return null
  }
}

export async function idbSetProgresso(userKey: string, data: unknown): Promise<void> {
  if (!isOfflineCacheSupported()) return
  const env: ProgressoIdbEnvelope = {
    v: 1,
    userKey,
    data,
    savedAt: Date.now(),
  }
  await idbSetRaw(progressoKey(userKey), env)
  setOfflineUserKeyHint(userKey)
}

export async function idbGetEtapa(
  id: string,
  lang: string,
  expectedContentVersion: string | null,
): Promise<EtapaIdbEnvelope | null> {
  if (!isOfflineCacheSupported()) return null
  try {
    const raw = await idbGetRaw(etapaKey(id, lang))
    if (!raw || typeof raw !== 'object') return null
    const env = raw as EtapaIdbEnvelope
    if (env.v !== 1) return null
    if (expectedContentVersion !== null && env.contentVersion !== expectedContentVersion) return null
    return env
  } catch {
    return null
  }
}

export async function idbSetEtapa(id: string, lang: string, contentVersion: string, data: unknown): Promise<void> {
  if (!isOfflineCacheSupported()) return
  const env: EtapaIdbEnvelope = {
    v: 1,
    contentVersion,
    data,
    savedAt: Date.now(),
  }
  await idbSetRaw(etapaKey(id, lang), env)
}

/** Remove snapshots de catálogo quando a versão de conteúdo do servidor mudar. */
export async function idbInvalidateCatalogCaches(): Promise<void> {
  if (!isOfflineCacheSupported()) return
  const db = await idbOpen()
  const keysToDelete: string[] = []
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const cur = tx.objectStore(STORE).openCursor()
    cur.onerror = () => reject(cur.error)
    cur.onsuccess = () => {
      const c = cur.result
      if (!c) {
        resolve()
        return
      }
      const k = String(c.key)
      if (k.startsWith('trilhas:') || k.startsWith('etapa:')) keysToDelete.push(k)
      c.continue()
    }
  })
  for (const k of keysToDelete) {
    await idbDeleteRaw(k)
  }
}

export async function idbClearUserProgressCaches(userKey: string): Promise<void> {
  if (!isOfflineCacheSupported()) return
  await idbDeleteRaw(progressoKey(userKey))
}

export async function idbClearAllSqlQuestCaches(): Promise<void> {
  if (!isOfflineCacheSupported()) return
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve()
  })
}
