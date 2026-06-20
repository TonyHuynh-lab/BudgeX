import { int, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const accounts = sqliteTable('accounts', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  type: text().notNull(), // 'checking' | 'savings' | 'credit'
  currency: text().notNull().default('USD'),
  openingBalance: real().notNull().default(0),
  closed: int({ mode: 'boolean' }).notNull().default(false),
  cashbackRate: real().notNull().default(0) // default percent, credit accounts only (e.g. 2 = 2%)
})

export const cashbackRates = sqliteTable('cashback_rates', {
  id: int().primaryKey({ autoIncrement: true }),
  accountId: int().notNull().references(() => accounts.id),
  category: text().notNull(),
  rate: real().notNull().default(0) // percent, overrides accounts.cashbackRate for this category
}, (t) => [uniqueIndex('account_category').on(t.accountId, t.category)])

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
  purchaseDate: text().notNull(),
  currentPrice: real().notNull().default(0)
})

export const savingsGoals = sqliteTable('savings_goals', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  targetAmount: real().notNull(),
  currentAmount: real().notNull().default(0),
  targetDate: text()
})

export const priceSnapshots = sqliteTable('price_snapshots', {
  id: int().primaryKey({ autoIncrement: true }),
  ticker: text().notNull(),
  price: real().notNull(),
  date: text().notNull(),
}, (t) => [uniqueIndex('ticker_date').on(t.ticker, t.date)])
