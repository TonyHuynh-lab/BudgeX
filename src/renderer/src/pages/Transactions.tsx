import { useEffect, useState } from 'react'
import {
  useTransactions,
  useAccounts,
  useCashbackRates,
  useSettings,
  getAccountBalance,
  getCashbackBalance,
  CASHBACK_REDEMPTION_CATEGORY
} from '../store/index'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select'
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../lib/utils'

const CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Housing',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Utilities',
  'Income',
  'Other'
]

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#A28FE0',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4'
]

export default function Transactions(): React.JSX.Element {
  const { transactions, load, create, delete: deleteTransaction } = useTransactions()
  const {
    accounts,
    load: loadAccounts,
    create: createAccount,
    update: updateAccount,
    delete: deleteAccount
  } = useAccounts()
  const {
    cashbackRates,
    load: loadCashbackRates,
    upsert: upsertCashbackRate,
    delete: deleteCashbackRate
  } = useCashbackRates()
  const { settings } = useSettings()
  const currency = settings?.currency ?? 'USD'
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    date: '',
    amount: '',
    category: '',
    description: '',
    kind: 'expense',
    accountId: '',
    payFrom: ''
  })
  const [chartFilter, setChartFilter] = useState<'expense' | 'all'>('expense')
  const [selectedAccountId, setSelectedAccountId] = useState('all')
  const [accountOpen, setAccountOpen] = useState(false)
  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'checking',
    currency: 'USD',
    openingBalance: '',
    cashbackRate: ''
  })
  const [editCashbackOpen, setEditCashbackOpen] = useState(false)
  const [cashbackRateInput, setCashbackRateInput] = useState('')
  const [newCategoryRate, setNewCategoryRate] = useState({ category: '', rate: '' })

  useEffect(() => {
    load()
    loadAccounts()
    loadCashbackRates()
  }, [])

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const creditAccount = accounts.find((a) => a.id === Number(form.accountId))
    const amount = Math.abs(parseFloat(form.amount))

    if (form.kind === 'payment') {
      if (!form.payFrom) {
        window.alert('Please select where this payment is coming from.')
        return
      }
      if (form.payFrom === 'cashback') {
        const available = creditAccount
          ? getCashbackBalance(creditAccount, transactions, cashbackRates)
          : 0
        if (amount > available) {
          window.alert(
            `This account only has ${formatCurrency(available, currency)} of cashback available.`
          )
          return
        }
        await create({
          date: form.date,
          amount: -amount,
          category: CASHBACK_REDEMPTION_CATEGORY,
          description: 'Paid with cashback',
          accountId: Number(form.accountId)
        })
      } else {
        const fundingAccount = accounts.find((a) => a.id === Number(form.payFrom))
        await create({
          date: form.date,
          amount: -amount,
          category: 'Credit Card Payment',
          description: `Payment from ${fundingAccount?.name ?? ''}`,
          accountId: Number(form.accountId)
        })
        await create({
          date: form.date,
          amount: -amount,
          category: 'Credit Card Payment',
          description: `Payment to ${creditAccount?.name ?? ''}`,
          accountId: Number(form.payFrom)
        })
      }
    } else {
      const isReduction = form.kind === 'expense'
      await create({
        date: form.date,
        amount: isReduction ? -amount : amount,
        category: form.category,
        description: form.description || null,
        accountId: Number(form.accountId)
      })
    }
    setForm({
      date: '',
      amount: '',
      category: '',
      description: '',
      kind: 'expense',
      accountId: '',
      payFrom: ''
    })
    setOpen(false)
  }

  const handleAccountSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    await createAccount({
      name: accountForm.name,
      type: accountForm.type,
      currency: accountForm.currency,
      openingBalance: parseFloat(accountForm.openingBalance) || 0,
      cashbackRate: parseFloat(accountForm.cashbackRate) || 0
    })
    setAccountForm({
      name: '',
      type: 'checking',
      currency: 'USD',
      openingBalance: '',
      cashbackRate: ''
    })
    setAccountOpen(false)
  }

  const openAccounts = accounts.filter((a) => !a.closed)
  const fundingAccounts = openAccounts.filter((a) => a.type === 'checking' || a.type === 'savings')
  const selectedAccount = accounts.find((a) => a.id === Number(selectedAccountId))
  const isCreditAccount = selectedAccount?.type === 'credit'

  const formAccount = accounts.find((a) => a.id === Number(form.accountId))
  const formAccountCashback = formAccount
    ? getCashbackBalance(formAccount, transactions, cashbackRates)
    : 0

  const handleToggleClosed = async () => {
    if (!selectedAccount) return
    await updateAccount({ ...selectedAccount, closed: !selectedAccount.closed })
  }

  const handleEditCashbackSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedAccount) return
    await updateAccount({ ...selectedAccount, cashbackRate: parseFloat(cashbackRateInput) || 0 })
    setEditCashbackOpen(false)
  }

  const accountCashbackRates = cashbackRates.filter((r) => r.accountId === selectedAccount?.id)

  const handleAddCategoryRate = async () => {
    if (!selectedAccount || !newCategoryRate.category) return
    await upsertCashbackRate({
      accountId: selectedAccount.id,
      category: newCategoryRate.category,
      rate: parseFloat(newCategoryRate.rate) || 0
    })
    setNewCategoryRate({ category: '', rate: '' })
  }

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return
    const count = transactions.filter((t) => t.accountId === selectedAccount.id).length
    const message =
      count > 0
        ? `${selectedAccount.name} has ${count} transaction${count === 1 ? '' : 's'} linked to it. Deleting the account will not delete those transactions. Continue?`
        : `Delete ${selectedAccount.name}?`
    if (!window.confirm(message)) return
    await deleteAccount(selectedAccount.id)
    setSelectedAccountId('all')
  }

  const currentBalance =
    selectedAccountId === 'all'
      ? openAccounts.reduce((sum, a) => {
          const balance = getAccountBalance(a, transactions)
          return sum + (a.type === 'credit' ? -balance : balance)
        }, 0)
      : selectedAccount
        ? getAccountBalance(selectedAccount, transactions)
        : 0

  const balanceLabel =
    selectedAccountId === 'all'
      ? 'Total Balance'
      : `${selectedAccount?.name ?? ''} — ${isCreditAccount ? 'Current Balance' : 'Available Balance'}`

  const filteredTransactions =
    selectedAccountId === 'all'
      ? transactions
      : transactions.filter((t) => t.accountId === Number(selectedAccountId))

  const chartData = Object.entries(
    filteredTransactions
      .filter((t) => (chartFilter === 'expense' ? t.amount < 0 : true))
      .reduce(
        (acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount)
          return acc
        },
        {} as Record<string, number>
      )
  ).map(([name, value], i) => ({ name, value, fill: COLORS[i % COLORS.length] }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Transaction</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Account</Label>
                <Select
                  value={form.accountId}
                  onValueChange={(v) => {
                    const acc = accounts.find((a) => a.id === Number(v))
                    setForm({
                      ...form,
                      accountId: v,
                      kind: acc?.type === 'credit' ? 'charge' : 'expense',
                      payFrom: ''
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {openAccounts.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 42.50"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <div className="flex rounded-md border text-sm overflow-hidden w-fit">
                  {form.kind === 'charge' || form.kind === 'payment' ? (
                    <>
                      <button
                        type="button"
                        className={`px-3 py-1 transition-colors ${form.kind === 'charge' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                        onClick={() => setForm({ ...form, kind: 'charge' })}
                      >
                        Charge
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-1 transition-colors ${form.kind === 'payment' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                        onClick={() => setForm({ ...form, kind: 'payment' })}
                      >
                        Payment
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`px-3 py-1 transition-colors ${form.kind === 'expense' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                        onClick={() => setForm({ ...form, kind: 'expense' })}
                      >
                        Expense
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-1 transition-colors ${form.kind === 'income' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                        onClick={() => setForm({ ...form, kind: 'income' })}
                      >
                        Income
                      </button>
                    </>
                  )}
                </div>
              </div>
              {form.kind === 'payment' && (
                <div className="space-y-1">
                  <Label>Pay From</Label>
                  <Select
                    value={form.payFrom}
                    onValueChange={(v) => setForm({ ...form, payFrom: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select funding source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cashback">
                        Cashback ({formatCurrency(formAccountCashback, currency)} available)
                      </SelectItem>
                      {fundingAccounts.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {form.kind !== 'payment' && (
                <>
                  <div className="space-y-1">
                    <Label>Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm({ ...form, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input
                      id="description"
                      placeholder="e.g. Grocery run"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                </>
              )}
              <Button type="submit" className="w-full">
                Save
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Account filter + balance */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.name}
                  {a.closed ? ' (Closed)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog
            open={accountOpen}
            onOpenChange={(o) => {
              setAccountOpen(o)
              if (o) setAccountForm((f) => ({ ...f, currency }))
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline">Add Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Account</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="accountName">Name</Label>
                  <Input
                    id="accountName"
                    placeholder="e.g. Main Checking"
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select
                    value={accountForm.type}
                    onValueChange={(v) => setAccountForm({ ...accountForm, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    placeholder="e.g. USD"
                    value={accountForm.currency}
                    onChange={(e) => setAccountForm({ ...accountForm, currency: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="openingBalance">Opening Balance</Label>
                  <Input
                    id="openingBalance"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1000.00"
                    value={accountForm.openingBalance}
                    onChange={(e) =>
                      setAccountForm({ ...accountForm, openingBalance: e.target.value })
                    }
                  />
                </div>
                {accountForm.type === 'credit' && (
                  <div className="space-y-1">
                    <Label htmlFor="cashbackRate">Cashback Rate (%)</Label>
                    <Input
                      id="cashbackRate"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 2"
                      value={accountForm.cashbackRate}
                      onChange={(e) =>
                        setAccountForm({ ...accountForm, cashbackRate: e.target.value })
                      }
                    />
                  </div>
                )}
                <Button type="submit" className="w-full">
                  Save
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <div>
                <CardDescription>{balanceLabel}</CardDescription>
                <CardTitle className="text-3xl font-mono">
                  {formatCurrency(currentBalance, currency)}
                </CardTitle>
                {isCreditAccount && selectedAccount && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Cashback available:{' '}
                    {formatCurrency(
                      getCashbackBalance(selectedAccount, transactions, cashbackRates),
                      currency
                    )}{' '}
                    ({selectedAccount.cashbackRate}% default rate)
                  </p>
                )}
              </div>
              {selectedAccount && (
                <div className="flex gap-2">
                  {isCreditAccount && (
                    <Dialog
                      open={editCashbackOpen}
                      onOpenChange={(o) => {
                        if (o) setCashbackRateInput(String(selectedAccount.cashbackRate))
                        setEditCashbackOpen(o)
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Cashback Rates
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cashback Rates — {selectedAccount.name}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleEditCashbackSubmit} className="space-y-4">
                          <div className="space-y-1">
                            <Label htmlFor="editCashbackRate">Default Rate (%)</Label>
                            <Input
                              id="editCashbackRate"
                              type="number"
                              step="0.1"
                              placeholder="e.g. 2"
                              value={cashbackRateInput}
                              onChange={(e) => setCashbackRateInput(e.target.value)}
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Applies to any category without its own rate below.
                            </p>
                          </div>
                          <Button type="submit" className="w-full">
                            Save Default Rate
                          </Button>
                        </form>

                        <div className="space-y-2 border-t pt-4">
                          <Label>Category Rates</Label>
                          {accountCashbackRates.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No category-specific rates yet.
                            </p>
                          ) : (
                            accountCashbackRates.map((r) => (
                              <div key={r.id} className="flex items-center justify-between text-sm">
                                <span>{r.category}</span>
                                <div className="flex items-center gap-2">
                                  <span>{r.rate}%</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteCashbackRate(r.id)}
                                  >
                                    ✕
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="flex items-end gap-2">
                          <div className="space-y-1 flex-1">
                            <Label>Category</Label>
                            <Select
                              value={newCategoryRate.category}
                              onValueChange={(v) =>
                                setNewCategoryRate({ ...newCategoryRate, category: v })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map((c) => (
                                  <SelectItem key={c} value={c}>
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1 w-24">
                            <Label>Rate (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="e.g. 5"
                              value={newCategoryRate.rate}
                              onChange={(e) =>
                                setNewCategoryRate({ ...newCategoryRate, rate: e.target.value })
                              }
                            />
                          </div>
                          <Button type="button" onClick={handleAddCategoryRate}>
                            Add
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button variant="outline" size="sm" onClick={handleToggleClosed}>
                    {selectedAccount.closed ? 'Reopen Account' : 'Close Account'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeleteAccount}>
                    Delete Account
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Table + Chart */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No transactions yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.date}</TableCell>
                        <TableCell>{t.description ?? '—'}</TableCell>
                        <TableCell>{t.category}</TableCell>
                        <TableCell
                          className={`text-right font-mono ${t.amount < 0 ? 'text-red-500' : 'text-green-500'}`}
                        >
                          {t.amount < 0 ? '-' : '+'}
                          {formatCurrency(Math.abs(t.amount), currency)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => deleteTransaction(t.id)}>
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Pie chart */}
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
            <CardTitle>By Category</CardTitle>
            <div className="flex rounded-md border text-sm overflow-hidden w-fit">
              <button
                className={`px-3 py-1 transition-colors ${chartFilter === 'expense' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                onClick={() => setChartFilter('expense')}
              >
                Expenses
              </button>
              <button
                className={`px-3 py-1 transition-colors ${chartFilter === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                onClick={() => setChartFilter('all')}
              >
                All
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center pt-8">
                Add transactions to see breakdown
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  />
                  <Tooltip
                    formatter={(val) =>
                      typeof val === 'number' ? formatCurrency(val, currency) : val
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
