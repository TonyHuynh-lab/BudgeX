import { app, dialog, ipcMain } from 'electron'
import { eq, desc } from 'drizzle-orm'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { db } from '../db'
import { accounts, transactions, subscriptions, stockPositions, savingsGoals, priceSnapshots, cashbackRates, settings, investmentAccounts } from '../db/schema'
import yahooFinanceModule from 'yahoo-finance2'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yahooFinance = (yahooFinanceModule as any).default ?? yahooFinanceModule

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
  ipcMain.handle('transactions:getAll', () => db.select().from(transactions).orderBy(desc(transactions.date)))
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

  // Investment Accounts
  ipcMain.handle('investmentAccounts:getAll', () => db.select().from(investmentAccounts))
  ipcMain.handle('investmentAccounts:create', (_, data) => db.insert(investmentAccounts).values(data).returning())
  ipcMain.handle('investmentAccounts:update', (_, { id, ...data }) =>
    db.update(investmentAccounts).set(data).where(eq(investmentAccounts.id, id)).returning()
  )
  ipcMain.handle('investmentAccounts:delete', (_, id) =>
    db.delete(investmentAccounts).where(eq(investmentAccounts.id, id)).run()
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

  // inside registerHandlers():
  ipcMain.handle('priceSnapshots:getAll', () => db.select().from(priceSnapshots))
  ipcMain.handle('priceSnapshots:upsert', (_, data: { ticker: string; price: number; date: string }) =>
  db.insert(priceSnapshots)
    .values(data)
    .onConflictDoUpdate({ target: [priceSnapshots.ticker, priceSnapshots.date], set: { price: data.price } })
    .run()
  )

  // Cashback Rates
  ipcMain.handle('cashbackRates:getAll', () => db.select().from(cashbackRates))
  ipcMain.handle('cashbackRates:upsert', (_, data: { accountId: number; category: string; rate: number }) =>
    db.insert(cashbackRates)
      .values(data)
      .onConflictDoUpdate({ target: [cashbackRates.accountId, cashbackRates.category], set: { rate: data.rate } })
      .run()
  )
  ipcMain.handle('cashbackRates:delete', (_, id) =>
    db.delete(cashbackRates).where(eq(cashbackRates.id, id)).run()
  )

  // Settings (single row, created on first read)
  ipcMain.handle('settings:get', async () => {
    const existing = await db.select().from(settings)
    if (existing.length > 0) return existing[0]
    const created = await db.insert(settings).values({}).returning()
    return created[0]
  })
  ipcMain.handle('settings:update', async (_, data: { theme?: string; currency?: string }) => {
    const existing = await db.select().from(settings)
    if (existing.length === 0) return db.insert(settings).values(data).returning()
    return db.update(settings).set(data).where(eq(settings.id, existing[0].id)).returning()
  })

  // App info
  ipcMain.handle('app:getInfo', () => ({
    dbPath: join(app.getPath('userData'), 'data.db')
  }))

  // Data export / reset
  ipcMain.handle('data:export', async () => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export Budgex Data',
      defaultPath: `budgex-export-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (canceled || !filePath) return { canceled: true as const }

    const [accountsData, transactionsData, subscriptionsData, stockPositionsData, savingsGoalsData, priceSnapshotsData, cashbackRatesData, investmentAccountsData] =
      await Promise.all([
        db.select().from(accounts),
        db.select().from(transactions),
        db.select().from(subscriptions),
        db.select().from(stockPositions),
        db.select().from(savingsGoals),
        db.select().from(priceSnapshots),
        db.select().from(cashbackRates),
        db.select().from(investmentAccounts)
      ])

    writeFileSync(
      filePath,
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          accounts: accountsData,
          transactions: transactionsData,
          subscriptions: subscriptionsData,
          stockPositions: stockPositionsData,
          savingsGoals: savingsGoalsData,
          priceSnapshots: priceSnapshotsData,
          cashbackRates: cashbackRatesData,
          investmentAccounts: investmentAccountsData
        },
        null,
        2
      ),
      'utf-8'
    )
    return { canceled: false as const, filePath }
  })

  ipcMain.handle('data:reset', () => {
    db.delete(cashbackRates).run()
    db.delete(transactions).run()
    db.delete(priceSnapshots).run()
    db.delete(stockPositions).run()
    db.delete(investmentAccounts).run()
    db.delete(savingsGoals).run()
    db.delete(subscriptions).run()
    db.delete(accounts).run()
  })

  // Additional handlers for fetching stock prices from Yahoo Finance
  ipcMain.handle('stockPrices:fetch', async (_, tickers: string[]) => {
    const results: Record<string, number> = {}
    await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });
          const quote = await yf.quote(ticker);
          if (quote.regularMarketPrice) {
            results[ticker] = quote.regularMarketPrice
          }
        } catch (error) {
          console.error(`Error fetching price for ${ticker}:`, error)
        }
      })
    )
    return results
  })
}
