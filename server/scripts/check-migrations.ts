import Database from 'better-sqlite3'

const db = new Database('./dev.db')

try {
  const migrations = db.prepare('SELECT * FROM _prisma_migrations ORDER BY finished_at DESC').all()
  console.log('Migrations:', JSON.stringify(migrations, null, 2))
} catch(e: any) {
  console.log('No migrations table:', e.message)
}

// Check table schemas
const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'").all()
for (const t of tables as any[]) {
  const count = db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get() as any
  console.log(`${t.name}: ${count.c} rows`)
}

db.close()
