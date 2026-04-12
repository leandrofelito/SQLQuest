import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const url = process.env.DATABASE_URL
const direct = process.env.DIRECT_URL

if (!url || url === '""' || url === '') {
  console.log('')
  console.log('❌ DATABASE_URL não configurada.')
  console.log('')
  console.log('Siga estes passos:')
  console.log('1. Acesse: https://neon.tech')
  console.log('2. Crie uma conta gratuita')
  console.log('3. Crie um projeto novo')
  console.log('4. Copie a connection string (começa com postgresql://)')
  console.log('5. Cole no arquivo .env.local na variável DATABASE_URL')
  console.log('')
  console.log('Depois rode novamente:')
  console.log('   npx prisma db push')
  console.log('   npm run seed')
  console.log('')
  process.exit(1)
}

if (!direct || direct === '""' || direct === '') {
  console.log('')
  console.log('❌ DIRECT_URL não configurada.')
  console.log('')
  console.log('O Prisma usa DIRECT_URL para migrate/db push (conexão direta ao Postgres).')
  console.log('No Neon: use a string "direct" / sem pooler. Em dev local, pode ser igual a DATABASE_URL.')
  console.log('')
  process.exit(1)
}

console.log('✅ DATABASE_URL e DIRECT_URL configuradas. Pode rodar o seed.')
