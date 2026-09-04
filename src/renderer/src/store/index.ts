import { create } from 'zustand'

// Transaction type definition
export type Transaction = {
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
export type Account = {
  id: number
  name: string
  type: string
  currency: string
  openingBalance: number
  closed: boolean
  cashbackRate: number
}

// Reserved transaction category marking a credit payment funded by that account's own
// cashback balance, instead of a transfer from another account.
export const CASHBACK_REDEMPTION_CATEGORY = 'Cashback Redemption'

// Reserved transaction category for the two rows written when a credit card is paid from
// another account. Both sides are transfers, not spending, so anything totalling expenses
// must exclude them — the charge itself was already counted when it was made.
export const CREDIT_CARD_PAYMENT_CATEGORY = 'Credit Card Payment'

// For checking/savings this is the available balance (positive = cash on hand).
// For credit accounts this is the amount owed (charges increase it, payments decrease it) —
// callers computing a net total across mixed account types must subtract credit balances.
export function getAccountBalance(account: Account, transactions: Transaction[]): number {
  return (
    account.openingBalance +
    transactions.filter((t) => t.accountId === account.id).reduce((sum, t) => sum + t.amount, 0)
  )
}

// CashbackRate type definition — a per-account, per-category override of accounts.cashbackRate
export type CashbackRate = {
  id: number
  accountId: number
  category: string
  rate: number
}

// Cashback balance for a credit account: each charge earns its category's rate (falling back
// to the account's default cashbackRate), minus whatever has already been redeemed to pay
// down the card (see CASHBACK_REDEMPTION_CATEGORY).
export function getCashbackBalance(
  account: Account,
  transactions: Transaction[],
  cashbackRates: CashbackRate[]
): number {
  const rateByCategory = new Map(
    cashbackRates.filter((r) => r.accountId === account.id).map((r) => [r.category, r.rate])
  )
  return transactions
    .filter((t) => t.accountId === account.id)
    .reduce((sum, t) => {
      if (t.amount > 0) {
        const rate = rateByCategory.get(t.category) ?? account.cashbackRate
        return sum + t.amount * (rate / 100)
      }
      if (t.category === CASHBACK_REDEMPTION_CATEGORY) return sum + t.amount
      return sum
    }, 0)
}

type CashbackRatesStore = {
  cashbackRates: CashbackRate[]
  load: () => Promise<void>
  upsert: (data: Omit<CashbackRate, 'id'>) => Promise<void>
  delete: (id: number) => Promise<void>
}

export const useCashbackRates = create<CashbackRatesStore>((set) => ({
  cashbackRates: [],
  load: async () => {
    const data = await window.api.cashbackRates.getAll()
    set({ cashbackRates: data })
  },
  upsert: async (data) => {
    await window.api.cashbackRates.upsert(data)
    const updated = await window.api.cashbackRates.getAll()
    set({ cashbackRates: updated })
  },
  delete: async (id) => {
    await window.api.cashbackRates.delete(id)
    set((state) => ({ cashbackRates: state.cashbackRates.filter((r) => r.id !== id) }))
  }
}))

type AccountsStore = {
  accounts: Account[]
  load: () => Promise<void>
  create: (data: Omit<Account, 'id' | 'closed'>) => Promise<void>
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

// InvestmentAccount type definition
export type InvestmentAccount = {
  id: number
  name: string
  type: string
}

type InvestmentAccountsStore = {
  investmentAccounts: InvestmentAccount[]
  load: () => Promise<void>
  create: (data: Omit<InvestmentAccount, 'id'>) => Promise<void>
  update: (data: InvestmentAccount) => Promise<void>
  delete: (id: number) => Promise<void>
}

export const useInvestmentAccounts = create<InvestmentAccountsStore>((set) => ({
  investmentAccounts: [],
  load: async () => {
    const data = await window.api.investmentAccounts.getAll()
    set({ investmentAccounts: data })
  },
  create: async (data) => {
    await window.api.investmentAccounts.create(data)
    const updated = await window.api.investmentAccounts.getAll()
    set({ investmentAccounts: updated })
  },
  update: async (data) => {
    await window.api.investmentAccounts.update(data)
    const updated = await window.api.investmentAccounts.getAll()
    set({ investmentAccounts: updated })
  },
  delete: async (id) => {
    await window.api.investmentAccounts.delete(id)
    set((state) => ({ investmentAccounts: state.investmentAccounts.filter((a) => a.id !== id) }))
  }
}))

// StockPosition type definition
type StockPosition = {
  id: number
  ticker: string
  shares: number
  avgCostBasis: number
  purchaseDate: string
  currentPrice: number
  accountId: number | null
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
  id: number
  name: string
  targetAmount: number
  currentAmount: number
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

// PriceSnapshot type definition
type PriceSnapshot = {
  id: number
  ticker: string
  price: number
  date: string
}

type PriceSnapshotsStore = {
  priceSnapshots: PriceSnapshot[]
  load: () => Promise<void>
  upsert: (data: Omit<PriceSnapshot, 'id'>) => Promise<void>
}

export const usePriceSnapshots = create<PriceSnapshotsStore>((set) => ({
  priceSnapshots: [],
  load: async () => {
    const data = await window.api.priceSnapshots.getAll()
    set({ priceSnapshots: data })
  },
  upsert: async (data) => {
    await window.api.priceSnapshots.upsert(data)
    const updated = await window.api.priceSnapshots.getAll()
    set({ priceSnapshots: updated })
  }
}))

// Settings type definition
export type Settings = {
  id: number
  theme: 'light' | 'dark' | 'system'
  currency: string
}

// Applies the resolved theme to the document root. 'system' resolves against the OS preference.
export function applyTheme(theme: Settings['theme']): void {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

type SettingsStore = {
  settings: Settings | null
  load: () => Promise<void>
  update: (data: Partial<Pick<Settings, 'theme' | 'currency'>>) => Promise<void>
}

export const useSettings = create<SettingsStore>((set) => ({
  settings: null,
  load: async () => {
    const data = await window.api.settings.get()
    set({ settings: data })
    applyTheme(data.theme)
  },
  update: async (data) => {
    const [updated] = await window.api.settings.update(data)
    set({ settings: updated })
    if (data.theme) applyTheme(updated.theme)
  }
}))
