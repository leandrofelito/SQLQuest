import type { QueryResult } from './sql-runner'
import type { ExercicioCheckConfig, ExercicioCheckType } from '@/types'

export function checkAnswer(
  rows: QueryResult[],
  checkType: ExercicioCheckType,
  checkConfig: ExercicioCheckConfig
): boolean {
  if (!rows || !rows[0]) return false
  const columns = rows[0].columns.map(c => c.toLowerCase())
  const values = rows[0].values

  switch (checkType) {
    case 'columns': {
      const hasAllCols = (checkConfig.required_columns ?? []).every(col =>
        columns.some(c => c.includes(col.toLowerCase()))
      )
      return hasAllCols && values.length >= (checkConfig.min_rows ?? 1)
    }
    case 'count':
      return values.length === checkConfig.expected_rows

    case 'values': {
      const first = values.map(r => r[0]).sort()
      const expected = [...(checkConfig.expected_values ?? [])].sort()
      return JSON.stringify(first) === JSON.stringify(expected)
    }
    case 'aggregate': {
      const hasAgg = columns.some(c =>
        ['sum', 'count', 'avg', 'min', 'max', 'total', 'receita', 'revenue', 'media'].some(k =>
          c.includes(k)
        )
      )
      return values.length >= (checkConfig.min_rows ?? 1) && hasAgg
    }
    default:
      return values.length > 0
  }
}
