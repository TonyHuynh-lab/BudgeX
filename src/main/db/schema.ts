import { int, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const accounts = sqliteTable('accounts', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  type: text().notNull(), // 'checking' | 'savings' | 'credit'
  currency: text().notNull().default('USD'),
  openingBalance: real().notNull().default(0)
})

export const transactions = sqliteTable('transactions', {
  id: int().primaryKey({ autoIncrement: true }),
  date: text().notNull(),
  amount: real().notNull(),
  category: text().notNull(),
  description: text(),
  accountId: int().references(() => accounts.id)
})

export const subscriptions = sqliteTable('subscriptions', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  amount: real().notNull(),
  billingCycle: text().notNull(), // 'monthly' | 'yearly'
  startDate: text().notNull(),
  category: text()
})

export const stockPositions = sqliteTable('stock_positions', {
  id: int().primaryKey({ autoIncrement: true }),
  ticker: text().notNull(),
  shares: real().notNull(),
  avgCostBasis: real().notNull(),
  purchaseDate: text().notNull()
})

export const savingsGoals = sqliteTable('savings_goals', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  targetAmount: real().notNull(),
  currentAmount: real().notNull().default(0),
  targetDate: text()
})
