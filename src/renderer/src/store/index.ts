import { create } from 'zustand'

// Transaction type definition
type Transaction = {
  id: number
  date: string
  amount: number
  category: string
  description: string | null
  accountId: number | null
}

type TransactionsStore = {
  transactions: Transaction[]
  load: () => Promise<void>
  create: (data: Omit<Transaction, 'id'>) => Promise<void>
  update: (data: Transaction) => Promise<void>
  delete: (id: number) => Promise<void>
}

export const useTransactions = create<TransactionsStore>((set) => ({
  transactions: [],
  load: async () => {
    const data = await window.api.transactions.getAll()
    set({ transactions: data })
  },
  create: async (data) => {
    await window.api.transactions.create(data)
    const updated = await window.api.transactions.getAll()
    set({ transactions: updated })
  },
  update: async (data) => {
    await window.api.transactions.update(data)
    const updated = await window.api.transactions.getAll()
    set({ transactions: updated })
  },
  delete: async (id) => {
    await window.api.transactions.delete(id)
    set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }))
  }
}))

// Account type definition
type Account = {
  id: number
  name: string
  type: string
  currency: string
  openingBalance: number
}

type AccountsStore = {
  accounts: Account[]
  load: () => Promise<void>
  create: (data: Omit<Account, 'id'>) => Promise<void>
  update: (data: Account) => Promise<void>
  delete: (id: number) => Promise<void>
}

export const useAccounts = create<AccountsStore>((set) => ({
  accounts: [],
  load: async () => {
    const data = await window.api.accounts.getAll()
    set({ accounts: data })
  },
  create: async (data) => {
    await window.api.accounts.create(data)
    const updated = await window.api.accounts.getAll()
    set({ accounts: updated })
  },
  update: async (data) => {
    await window.api.accounts.update(data)
    const updated = await window.api.accounts.getAll()
    set({ accounts: updated })
  },
  delete: async (id) => {
    await window.api.accounts.delete(id)
    set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) }))
  }
}))

// Subscription type definition
type Subscription = {
  id: number
  name: string
  amount: number
  billingCycle: string
  startDate: string
  category: string | null
}

type SubscriptionsStore = {
    subscriptions: Subscription[]
    load: () => Promise<void>
    create: (data: Omit<Subscription, 'id'>) => Promise<void>
    update: (data: Subscription) => Promise<void>
    delete: (id: number) => Promise<void>
}

export const useSubscriptions = create<SubscriptionsStore>((set) => ({
    subscriptions: [],
    load: async () => {
        const data = await window.api.subscriptions.getAll()
        set({ subscriptions: data })
    },
    create: async (data) => {
        await window.api.subscriptions.create(data)
        const updated = await window.api.subscriptions.getAll()
        set({ subscriptions: updated })
    },
    update: async (data) => {
        await window.api.subscriptions.update(data)
        const updated = await window.api.subscriptions.getAll()
        set({ subscriptions: updated })
    },
    delete: async (id) => {
        await window.api.subscriptions.delete(id)
        set((state) => ({ subscriptions: state.subscriptions.filter((s) => s.id !== id) }))
    }
}))

// StockPosition type definition
type StockPosition = {
    id: number,
    ticker: string,
    shares: number,
    avgCostBasis: number,
    purchaseDate: string
}

type StockPositionsStore = {
    stockPositions: StockPosition[]
    load: () => Promise<void>
    create: (data: Omit<StockPosition, 'id'>) => Promise<void>
    update: (data: StockPosition) => Promise<void>
    delete: (id: number) => Promise<void>
}

export const useStockPositions = create<StockPositionsStore>((set) => ({
    stockPositions: [],
    load: async () => {
        const data = await window.api.stockPositions.getAll()
        set({ stockPositions: data })
    },
    create: async (data) => {
        await window.api.stockPositions.create(data)
        const updated = await window.api.stockPositions.getAll()
        set({ stockPositions: updated })
    },
    update: async (data) => {
        await window.api.stockPositions.update(data)
        const updated = await window.api.stockPositions.getAll()
        set({ stockPositions: updated })
    },
    delete: async (id) => {
        await window.api.stockPositions.delete(id)
        set((state) => ({ stockPositions: state.stockPositions.filter((s) => s.id !== id) }))
    }
}))

// SavingsGoal type definition
type SavingsGoal = {
    id: number,
    name: string,
    targetAmount: number,
    currentAmount: number,
    targetDate: string | null
}

type SavingsGoalsStore = {
    savingsGoals: SavingsGoal[]
    load: () => Promise<void>
    create: (data: Omit<SavingsGoal, 'id'>) => Promise<void>
    update: (data: SavingsGoal) => Promise<void>
    delete: (id: number) => Promise<void>
}

export const useSavingsGoals = create<SavingsGoalsStore>((set) => ({
    savingsGoals: [],
    load: async () => {
        const data = await window.api.savingsGoals.getAll()
        set({ savingsGoals: data })
    },
    create: async (data) => {
        await window.api.savingsGoals.create(data)
        const updated = await window.api.savingsGoals.getAll()
        set({ savingsGoals: updated })
    },
    update: async (data) => {
        await window.api.savingsGoals.update(data)
        const updated = await window.api.savingsGoals.getAll()
        set({ savingsGoals: updated })
    },
    delete: async (id) => {
        await window.api.savingsGoals.delete(id)
        set((state) => ({ savingsGoals: state.savingsGoals.filter((s) => s.id !== id) }))
    }
}))