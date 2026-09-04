import { useEffect, useState } from 'react'
import { useSubscriptions, useSettings } from '../store/index'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
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
import { formatCurrency } from '../lib/utils'

const CATEGORIES = ['Streaming', 'Software', 'News', 'Gaming', 'Fitness', 'Food', 'Other']

export function getNextRenewal(startDate: string, billingCycle: string) {
  const next = new Date(startDate)
  const today = new Date()
  while (next < today) {
    if (billingCycle === 'monthly') {
      next.setMonth(next.getMonth() + 1)
    } else if (billingCycle === 'yearly') {
      next.setFullYear(next.getFullYear() + 1)
    }
  }
  return next
}

export default function Subscriptions(): React.JSX.Element {
  const { subscriptions, load, create, delete: deleteSubscription } = useSubscriptions()
  const { settings } = useSettings()
  const currency = settings?.currency ?? 'USD'
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    amount: '',
    billingCycle: 'monthly',
    startDate: '',
    category: ''
  })

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    await create({
      name: form.name,
      amount: parseFloat(form.amount),
      billingCycle: form.billingCycle,
      startDate: form.startDate,
      category: form.category || null
    })
    setForm({ name: '', amount: '', billingCycle: 'monthly', startDate: '', category: '' })
    setOpen(false)
  }

  const monthlyTotal = subscriptions.reduce(
    (acc, s) => acc + (s.billingCycle === 'monthly' ? s.amount : s.amount / 12),
    0
  )
  const annualTotal = monthlyTotal * 12

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Subscription</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Subscription</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Netflix"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 15.99"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Billing Cycle</Label>
                <Select
                  value={form.billingCycle}
                  onValueChange={(v) => setForm({ ...form, billingCycle: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Category (optional)</Label>
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
              <Button type="submit" className="w-full">
                Save
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary totals */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Monthly Total</CardDescription>
            <CardTitle className="text-3xl font-mono">
              {formatCurrency(monthlyTotal, currency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Annual Total</CardDescription>
            <CardTitle className="text-3xl font-mono">
              {formatCurrency(annualTotal, currency)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Subscription cards */}
      {subscriptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No subscriptions yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {subscriptions.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{s.name}</CardTitle>
                    {s.category && (
                      <span className="text-xs text-muted-foreground">{s.category}</span>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteSubscription(s.id)}>
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold font-mono">
                  {formatCurrency(s.amount, currency)}
                </p>
                <p className="text-sm text-muted-foreground capitalize">{s.billingCycle}</p>
                <p className="text-xs text-muted-foreground mt-1">Since {s.startDate}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
