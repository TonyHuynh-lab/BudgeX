import { useEffect, useState } from 'react'
import { useTransactions } from '../store/index'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Checkbox } from '../components/ui/checkbox'
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const CATEGORIES = [
  'Food & Dining', 'Transport', 'Housing', 'Entertainment',
  'Healthcare', 'Shopping', 'Utilities', 'Income', 'Other'
]

const COLORS = ['#0088FE','#00C49F','#FFBB28','#FF8042','#A28FE0','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4']

export default function Transactions(): React.JSX.Element {
    const { transactions, load, create, delete: deleteTransaction } = useTransactions()
    const [open, setOpen] = useState(false)
    const [form, setForm] = useState({ date: '', amount: '', category: '', description: '', isExpense: true })
    const [chartFilter, setChartFilter] = useState<'expense' | 'all'>('expense')

    useEffect(() => { load() }, [])

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        await create({
        date: form.date,
        amount: form.isExpense ? -Math.abs(parseFloat(form.amount)) : Math.abs(parseFloat(form.amount)),
        category: form.category,
        description: form.description || null,
        accountId: null,
        })
        setForm({ date: '', amount: '', category: '', description: '', isExpense: true })
        setOpen(false)
    }

    const chartData = Object.entries(
    transactions
        .filter((t) => chartFilter === 'expense' ? t.amount < 0 : true)
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount)
            return acc
        }, {} as Record<string, number>)
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
                    <Input id="date" type="date" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" type="number" step="0.01" placeholder="e.g. 42.50"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div className="flex items-center gap-2">
                    <Checkbox
                    id="isExpense"
                    checked={form.isExpense}
                    onCheckedChange={(checked: boolean | 'indeterminate') => setForm({ ...form, isExpense: checked === true })}
                    />
                    <Label htmlFor="isExpense">This is an expense</Label>
                </div>
                <div className="space-y-1">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input id="description" placeholder="e.g. Grocery run" value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <Button type="submit" className="w-full">Save</Button>
                </form>
            </DialogContent>
            </Dialog>
        </div>

        {/* Table + Chart */}
        <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
            <Card>
                <CardHeader><CardTitle>All Transactions</CardTitle></CardHeader>
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
                    {transactions.length === 0 ? (
                        <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No transactions yet
                        </TableCell>
                        </TableRow>
                    ) : (
                        transactions.map((t) => (
                        <TableRow key={t.id}>
                            <TableCell>{t.date}</TableCell>
                            <TableCell>{t.description ?? '—'}</TableCell>
                            <TableCell>{t.category}</TableCell>
                            <TableCell className={`text-right font-mono ${t.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {t.amount < 0 ? '-' : '+'}${Math.abs(t.amount).toFixed(2)}
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
                    onClick={() => setChartFilter('expense')}>
                    Expenses
                    </button>
                    <button
                    className={`px-3 py-1 transition-colors ${chartFilter === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                    onClick={() => setChartFilter('all')}>
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
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} />
                    <Tooltip formatter={(val) => (typeof val === 'number' ? `$${val.toFixed(2)}` : val)} />
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
