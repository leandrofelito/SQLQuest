'use client'

let SQL: any = null
let db: any = null

function formatarErroSql(error: unknown): string {
  const mensagemOriginal =
    error instanceof Error ? error.message : typeof error === 'string' ? error : 'Erro desconhecido ao executar SQL'

  const nearMatch = mensagemOriginal.match(/near\s+"([^"]+)":\s*syntax error/i)
  if (nearMatch) {
    const token = nearMatch[1]
    return `Erro de sintaxe perto de "${token}". Revise a query antes desse ponto (ex: SELECT/FROM/JOIN/ON na ordem correta, vírgulas e espaços).`
  }

  if (/no such table/i.test(mensagemOriginal)) {
    return 'Tabela não encontrada no schema deste exercício.'
  }

  if (/no such column/i.test(mensagemOriginal)) {
    return 'Coluna não encontrada. Verifique nomes de colunas e aliases usados na query.'
  }

  if (/ambiguous column name/i.test(mensagemOriginal)) {
    return 'Nome de coluna ambíguo. Use alias (ex: t1.coluna) para deixar explícito.'
  }

  if (/syntax error/i.test(mensagemOriginal)) {
    return 'Erro de sintaxe SQL. Revise palavras-chave, parênteses, vírgulas e a ordem dos comandos.'
  }

  return mensagemOriginal
}

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

  try {
    db.run(schema)
  } catch (error) {
    throw new Error(`Erro ao preparar o exercício: ${formatarErroSql(error)}`)
  }

  try {
    return db.exec(query)
  } catch (error) {
    throw new Error(formatarErroSql(error))
  }
}

export type QueryResult = {
  columns: string[]
  values: unknown[][]
}
