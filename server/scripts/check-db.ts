import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.resolve(__dirname, '..', 'dev.db')

const db = new Database(dbPath)

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'").all() as any[]

console.log('=== Database Status ===')
console.log(`Path: ${dbPath}\n`)

let totalRows = 0
for (const t of tables) {
  const count = db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get() as any
  totalRows += count.c
  console.log(`  ${t.name}: ${count.c} rows`)
}

console.log(`\nTotal: ${totalRows} rows across ${tables.length} tables`)

// Check for migration table (should NOT exist with db push workflow)
try {
  db.prepare("SELECT 1 FROM _prisma_migrations LIMIT 1").get()
  console.log('\n⚠ WARNING: _prisma_migrations table found!')
  console.log('  Do NOT run "npx prisma migrate dev" - it may reset your database.')
  console.log('  Use "npx prisma db push" instead.')
} catch {
  // Good - no migration table
}

if (totalRows === 0) {
  console.log('\n⚠ Database is EMPTY! Run seed scripts:')
  console.log('  npm run db:seed')
  console.log('  npm run db:seed:demo')
}

db.close()
