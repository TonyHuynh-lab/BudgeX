import { ElectronAPI } from '@electron-toolkit/preload'

type Account = { id: number; name: string; type: string; currency: string; openingBalance: number; closed: boolean; cashbackRate: number }
type Transaction = { id: number; date: string; amount: number; category: string; description: string | null; accountId: number | null }
type Subscription = { id: number; name: string; amount: number; billingCycle: string; startDate: string; category: string | null }
type StockPosition = { id: number; ticker: string; shares: number; avgCostBasis: number; purchaseDate: string; currentPrice: number; accountId: number | null }
type InvestmentAccount = { id: number; name: string; type: string }
type SavingsGoal = { id: number; name: string; targetAmount: number; currentAmount: number; targetDate: string | null }
type PriceSnapshot = { id: number; ticker: string; price: number; date: string }
type CashbackRate = { id: number; accountId: number; category: string; rate: number }
type Settings = { id: number; theme: 'light' | 'dark' | 'system'; currency: string }

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      accounts: {
        getAll: () => Promise<Account[]>
        create: (data: Omit<Account, 'id' | 'closed'>) => Promise<Account[]>
        update: (data: Account) => Promise<Account[]>
        delete: (id: number) => Promise<void>
      }
      transactions: {
        getAll: () => Promise<Transaction[]>
        create: (data: Omit<Transaction, 'id'>) => Promise<Transaction[]>
        update: (data: Transaction) => Promise<Transaction[]>
        delete: (id: number) => Promise<void>
      }
      subscriptions: {
        getAll: () => Promise<Subscription[]>
        create: (data: Omit<Subscription, 'id'>) => Promise<Subscription[]>
        update: (data: Subscription) => Promise<Subscription[]>
        delete: (id: number) => Promise<void>
      }
      stockPositions: {
        getAll: () => Promise<StockPosition[]>
        create: (data: Omit<StockPosition, 'id'>) => Promise<StockPosition[]>
        update: (data: StockPosition) => Promise<StockPosition[]>
        delete: (id: number) => Promise<void>
      }
      investmentAccounts: {
        getAll: () => Promise<InvestmentAccount[]>
        create: (data: Omit<InvestmentAccount, 'id'>) => Promise<InvestmentAccount[]>
        update: (data: InvestmentAccount) => Promise<InvestmentAccount[]>
        delete: (id: number) => Promise<void>
      }
      savingsGoals: {
        getAll: () => Promise<SavingsGoal[]>
        create: (data: Omit<SavingsGoal, 'id'>) => Promise<SavingsGoal[]>
        update: (data: SavingsGoal) => Promise<SavingsGoal[]>
        delete: (id: number) => Promise<void>
      }
      priceSnapshots: {
        getAll: () => Promise<PriceSnapshot[]>
        upsert: (data: Omit<PriceSnapshot, 'id'>) => Promise<void>
      }
      cashbackRates: {
        getAll: () => Promise<CashbackRate[]>
        upsert: (data: Omit<CashbackRate, 'id'>) => Promise<void>
        delete: (id: number) => Promise<void>
      }
      stockPrices: {
        fetch: (tickers: string[]) => Promise<Record<string, number>>
      }
      settings: {
        get: () => Promise<Settings>
        update: (data: Partial<Pick<Settings, 'theme' | 'currency'>>) => Promise<Settings[]>
      }
      appInfo: {
        get: () => Promise<{ dbPath: string }>
      }
      data: {
        export: () => Promise<{ canceled: true } | { canceled: false; filePath: string }>
        reset: () => Promise<void>
      }
    }
  }
}
