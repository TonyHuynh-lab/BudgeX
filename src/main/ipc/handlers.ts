import { ipcMain } from 'electron'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { accounts, transactions, subscriptions, stockPositions, savingsGoals } from '../db/schema'

export function registerHandlers(): void {
  // Accounts
  ipcMain.handle('accounts:getAll', () => db.select().from(accounts))
  ipcMain.handle('accounts:create', (_, data) => db.insert(accounts).values(data).returning())
  ipcMain.handle('accounts:update', (_, { id, ...data }) =>
    db.update(accounts).set(data).where(eq(accounts.id, id)).returning()
  )
  ipcMain.handle('accounts:delete', (_, id) =>
    db.delete(accounts).where(eq(accounts.id, id)).run()
  )

  // Transactions
  ipcMain.handle('transactions:getAll', () => db.select().from(transactions))
  ipcMain.handle('transactions:create', (_, data) => db.insert(transactions).values(data).returning())
  ipcMain.handle('transactions:update', (_, { id, ...data }) =>
    db.update(transactions).set(data).where(eq(transactions.id, id)).returning()
  )
  ipcMain.handle('transactions:delete', (_, id) =>
    db.delete(transactions).where(eq(transactions.id, id)).run()
  )

  // Subscriptions
  ipcMain.handle('subscriptions:getAll', () => db.select().from(subscriptions))
  ipcMain.handle('subscriptions:create', (_, data) => db.insert(subscriptions).values(data).returning())
  ipcMain.handle('subscriptions:update', (_, { id, ...data }) =>
    db.update(subscriptions).set(data).where(eq(subscriptions.id, id)).returning()
  )
  ipcMain.handle('subscriptions:delete', (_, id) =>
    db.delete(subscriptions).where(eq(subscriptions.id, id)).run()
  )

  // Stock Positions
  ipcMain.handle('stockPositions:getAll', () => db.select().from(stockPositions))
  ipcMain.handle('stockPositions:create', (_, data) => db.insert(stockPositions).values(data).returning())
  ipcMain.handle('stockPositions:update', (_, { id, ...data }) =>
    db.update(stockPositions).set(data).where(eq(stockPositions.id, id)).returning()
  )
  ipcMain.handle('stockPositions:delete', (_, id) =>
    db.delete(stockPositions).where(eq(stockPositions.id, id)).run()
  )

  // Savings Goals
  ipcMain.handle('savingsGoals:getAll', () => db.select().from(savingsGoals))
  ipcMain.handle('savingsGoals:create', (_, data) => db.insert(savingsGoals).values(data).returning())
  ipcMain.handle('savingsGoals:update', (_, { id, ...data }) =>
    db.update(savingsGoals).set(data).where(eq(savingsGoals.id, id)).returning()
  )
  ipcMain.handle('savingsGoals:delete', (_, id) =>
    db.delete(savingsGoals).where(eq(savingsGoals.id, id)).run()
  )
}
