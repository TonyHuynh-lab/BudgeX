import { useEffect } from 'react'
import { useTransactions, useAccounts, useSubscriptions, useStockPositions, useSavingsGoals, useCashbackRates, getAccountBalance, getCashbackBalance } from '../store/index'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getNextRenewal } from './Subscriptions'

export default function Dashboard(): React.JSX.Element {
  const { transactions, load: loadTransactions } = useTransactions()
  const { accounts, load: loadAccounts } = useAccounts()
  const { subscriptions, load: loadSubscriptions } = useSubscriptions()
  const { stockPositions, load: loadStockPositions } = useStockPositions()
  const { savingsGoals, load: loadSavingsGoals } = useSavingsGoals()
  const { cashbackRates, load: loadCashbackRates } = useCashbackRates()

  useEffect(() => {
    loadTransactions()
    loadAccounts()
    loadSubscriptions()
    loadStockPositions()
    loadSavingsGoals()
    loadCashbackRates()
  }, [])

  const now = new Date()
  const monthTransactions = transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const accountTypeById = new Map(accounts.map((a) => [a.id, a.type]))
  const isLiquidIncome = (t: { accountId: number | null; amount: number }) => {
    const type = accountTypeById.get(t.accountId ?? -1)
    return (type === 'checking' || type === 'savings') && t.amount > 0
  }
  const isCreditCharge = (t: { accountId: number | null; amount: number }) =>
    accountTypeById.get(t.accountId ?? -1) === 'credit' && t.amount > 0

  const monthlyIncome = monthTransactions
    .filter(isLiquidIncome)
    .reduce((sum, t) => sum + t.amount, 0)

  const monthlyExpenses = monthTransactions
    .filter(isCreditCharge)
    .reduce((sum, t) => sum + t.amount, 0)

  const accountsBalance = accounts.filter((a) => !a.closed).reduce((sum, a) => {
    const balance = getAccountBalance(a, transactions)
    if (a.type === 'credit') return sum - balance + getCashbackBalance(a, transactions, cashbackRates)
    return sum + balance
  }, 0)

  const stockValue = stockPositions.reduce((sum, s) => sum + s.shares * s.currentPrice, 0)

  const netWorth = accountsBalance + stockValue

  const savingsTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0)
  const savingsCurrent = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0)
  const savingsProgress = savingsTarget > 0 ? (savingsCurrent / savingsTarget) * 100 : 0

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label:
             d.toLocaleString('default', { month: 'short' }) }
  })

  const upcomingSubscriptions = subscriptions
    .map((s) => ({ ...s, nextRenewal: getNextRenewal(s.startDate, s.billingCycle) }))
    .sort((a, b) => a.nextRenewal.getTime() - b.nextRenewal.getTime())
    .slice(0, 5)

  const cashFlowData = months.map(({ key, label }) => {
    const [year, month] = key.split('-').map(Number)
    const matching = transactions.filter((t) => {
      const d = new Date(t.date)
      return d.getFullYear() === year && d.getMonth() === month
    })
    return {
      month: label,
      income: matching.filter(isLiquidIncome).reduce((sum, t) => sum + t.amount, 0),
      expenses: matching.filter(isCreditCharge).reduce((sum, t) => sum + t.amount, 0)
    }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Net Worth</CardDescription>
            <CardTitle className="text-3xl">${netWorth.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Monthly Income</CardDescription>
            <CardTitle className="text-3xl text-green-500">${monthlyIncome.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Monthly Expenses</CardDescription>
            <CardTitle className="text-3xl text-red-500">${monthlyExpenses.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Savings Progress</CardDescription>
            <CardTitle className="text-3xl">{savingsProgress.toFixed(0)}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(val) => (typeof val === 'number' ? `$${val.toFixed(2)}` : val)} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#00C49F" />
              <Bar dataKey="expenses" name="Expenses" fill="#FF6B6B" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingSubscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subscriptions yet.</p>
          ) : (
            <div className="space-y-2">
              {upcomingSubscriptions.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="text-muted-foreground">
                    ${s.amount.toFixed(2)} · {s.nextRenewal.toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Savings Goals</CardTitle>
        </CardHeader>
        <CardContent>
          {savingsGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No savings goals yet.</p>
          ) : (
            <div className="space-y-4">
              {savingsGoals.map((g) => {
                const progress = Math.min((g.currentAmount / g.targetAmount) * 100, 100)
                return (
                  <div key={g.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{g.name}</span>
                      <span className="text-muted-foreground">
                        ${g.currentAmount.toFixed(2)} of ${g.targetAmount.toFixed(2)}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
