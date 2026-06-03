import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

const dbPath = join(app.getPath('userData'), 'data.db')

const migrationsFolder = app.isPackaged
  ? join(process.resourcesPath, 'migrations')
  : join(__dirname, '../../resources/migrations')

const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')

export const db = drizzle(sqlite)

export function runMigrations(): void {
  migrate(db, { migrationsFolder })
}
