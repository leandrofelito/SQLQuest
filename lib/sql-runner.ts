'use client'

let SQL: any = null
let db: any = null

export async function initSQL(): Promise<void> {
  if (db) return
  const sqljs = await import('sql.js')
  SQL = await sqljs.default({
    locateFile: () => '/sql-wasm.wasm',
  })
  db = new SQL.Database()
}

export function executarSQL(schema: string, query: string) {
  if (!db) throw new Error('SQL não inicializado')

  try {
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'")
    if (tables[0]) {
      tables[0].values.forEach(([name]: [string]) => {
        db.run(`DROP TABLE IF EXISTS "${name}"`)
      })
    }
  } catch {}

  db.run(schema)
  return db.exec(query)
}

export type QueryResult = {
  columns: string[]
  values: unknown[][]
}
