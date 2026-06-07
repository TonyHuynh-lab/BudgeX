import { useEffect, useState } from 'react'
import { useSavingsGoals } from '../store/index'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Progress } from '../components/ui/progress'

export default function Savings(): React.JSX.Element {
  const { savingsGoals, load, create, update, delete: deleteGoal } = useSavingsGoals()
  const [open, setOpen] = useState(false)
  const [contributeGoalId, setContributeGoalId] = useState<number | null>(null)
  const [contributeAmount, setContributeAmount] = useState('')
  const [form, setForm] = useState({ name: '', targetAmount: '', currentAmount: '', targetDate: '' })

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    await create({
      name: form.name,
      targetAmount: parseFloat(form.targetAmount),
      currentAmount: parseFloat(form.currentAmount) || 0,
      targetDate: form.targetDate || null,
    })
    setForm({ name: '', targetAmount: '', currentAmount: '', targetDate: '' })
    setOpen(false)
  }

  const handleContribute = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const goal = savingsGoals.find((g) => g.id === contributeGoalId)
    if (!goal) return
    await update({ ...goal, currentAmount: goal.currentAmount + parseFloat(contributeAmount) })
    setContributeAmount('')
    setContributeGoalId(null)
  }

  const totalSaved = savingsGoals.reduce((acc, g) => acc + g.currentAmount, 0)
  const totalTarget = savingsGoals.reduce((acc, g) => acc + g.targetAmount, 0)
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  const activeContributeGoal = savingsGoals.find((g) => g.id === contributeGoalId)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Savings</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Goal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Savings Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Goal Name</Label>
                <Input id="name" placeholder="e.g. Emergency Fund" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="targetAmount">Target Amount</Label>
                <Input id="targetAmount" type="number" step="0.01" placeholder="e.g. 10000"
                  value={form.targetAmount}
                  onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="currentAmount">Current Amount (optional)</Label>
                <Input id="currentAmount" type="number" step="0.01" placeholder="e.g. 2500"
                  value={form.currentAmount}
                  onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="targetDate">Target Date (optional)</Label>
                <Input id="targetDate" type="date" value={form.targetDate}
                  onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overall summary */}
      {savingsGoals.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardDescription>Overall Progress</CardDescription>
                <CardTitle>${totalSaved.toFixed(2)} of ${totalTarget.toFixed(2)}</CardTitle>
              </div>
              <span className="text-2xl font-bold text-muted-foreground">
                {overallProgress.toFixed(0)}%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Goal cards */}
      {savingsGoals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No savings goals yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {savingsGoals.map((g) => {
            const progress = Math.min((g.currentAmount / g.targetAmount) * 100, 100)
            const remaining = g.targetAmount - g.currentAmount
            return (
              <Card key={g.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{g.name}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => deleteGoal(g.id)}>✕</Button>
                  </div>
                  {g.targetDate && (
                    <CardDescription>Target: {g.targetDate}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">${g.currentAmount.toFixed(2)}</span>
                    <span className="text-muted-foreground">of ${g.targetAmount.toFixed(2)}</span>
                  </div>
                  {remaining > 0 && (
                    <p className="text-xs text-muted-foreground">${remaining.toFixed(2)} remaining</p>
                  )}
                  {progress >= 100 && (
                    <p className="text-xs text-green-500 font-medium">Goal reached!</p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setContributeGoalId(g.id)}
                  >
                    Add Funds
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Contribute dialog */}
      <Dialog open={contributeGoalId !== null} onOpenChange={(o) => !o && setContributeGoalId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds — {activeContributeGoal?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleContribute} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="contribute">Amount to Add</Label>
              <Input id="contribute" type="number" step="0.01" placeholder="e.g. 500"
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">Add</Button>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
