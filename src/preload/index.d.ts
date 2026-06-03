import { ElectronAPI } from '@electron-toolkit/preload'

type Account = { id: number; name: string; type: string; currency: string; openingBalance: number }
type Transaction = { id: number; date: string; amount: number; category: string; description: string | null; accountId: number | null }
type Subscription = { id: number; name: string; amount: number; billingCycle: string; startDate: string; category: string | null }
type StockPosition = { id: number; ticker: string; shares: number; avgCostBasis: number; purchaseDate: string }
type SavingsGoal = { id: number; name: string; targetAmount: number; currentAmount: number; targetDate: string | null }

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      accounts: {
        getAll: () => Promise<Account[]>
        create: (data: Omit<Account, 'id'>) => Promise<Account[]>
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
      savingsGoals: {
        getAll: () => Promise<SavingsGoal[]>
        create: (data: Omit<SavingsGoal, 'id'>) => Promise<SavingsGoal[]>
        update: (data: SavingsGoal) => Promise<SavingsGoal[]>
        delete: (id: number) => Promise<void>
      }
    }
  }
}
