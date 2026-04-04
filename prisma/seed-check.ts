import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const url = process.env.DATABASE_URL

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

console.log('✅ DATABASE_URL configurada. Pode rodar o seed.')
