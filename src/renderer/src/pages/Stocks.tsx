import { useEffect, useState } from 'react'
import { usePriceSnapshots, useStockPositions } from '../store/index'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#0088FE','#00C49F','#FFBB28','#FF8042','#A28FE0','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4']

export default function Stocks(): React.JSX.Element {
  const { stockPositions, load, create, update, delete: deletePosition } = useStockPositions()
  const [open, setOpen] = useState(false)
  const [chartView, setChartView] = useState<'portfolio' | 'individual'>('portfolio')
  const [form, setForm] = useState({ ticker: '', shares: '', avgCostBasis: '', purchaseDate: '', currentPrice: '' })
  const { priceSnapshots, load: loadSnapshots, upsert } = usePriceSnapshots()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { load(); loadSnapshots() }, [])

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    await create({
      ticker: form.ticker.toUpperCase(),
      shares: parseFloat(form.shares),
      avgCostBasis: parseFloat(form.avgCostBasis),
      purchaseDate: form.purchaseDate,
      currentPrice: parseFloat(form.currentPrice) || 0,
    })
    setForm({ ticker: '', shares: '', avgCostBasis: '', purchaseDate: '', currentPrice: '' })
    setOpen(false)
  }

  const handlePriceChange = async (position: typeof stockPositions[0], newPrice: string) => {
    const price = parseFloat(newPrice)
    if (isNaN(price) || price <= 0) return
    await update({ ...position, currentPrice: price })
    await upsert({
      ticker: position.ticker,
      price,
      date: new Date().toISOString().split('T')[0],
    })
  }

  const handleRefreshPrices = async () => {
    if (stockPositions.length === 0) return
    setRefreshing(true)
    try {
      const tickers = stockPositions.map((s) => s.ticker)
      const prices = await window.api.stockPrices.fetch(tickers)
      const today = new Date().toISOString().split('T')[0]
      await Promise.all(
        stockPositions
          .filter((s) => prices[s.ticker] !== undefined)
          .map(async (s) => {
            await update({ ...s, currentPrice: prices[s.ticker] })
            await upsert({ ticker: s.ticker, price: prices[s.ticker], date: today })
          })
      )
      await load()
      await loadSnapshots()
    } finally {
      setRefreshing(false)
    }
  }


  const totalValue = stockPositions.reduce((acc, s) => acc + s.shares * s.currentPrice, 0)
  const totalCost = stockPositions.reduce((acc, s) => acc + s.shares * s.avgCostBasis, 0)
  const totalPnL = totalValue - totalCost

  const dates = [...new Set(priceSnapshots.map((s) => s.date))].sort()
  const growthData = dates.map((date) => {
    const entry: Record<string, number | string> = { date }
    let total = 0
    for (const position of stockPositions) {
      const latestSnapshot = priceSnapshots
        .filter((s) => s.ticker === position.ticker && s.date <= date)
        .sort((a, b) => b.date.localeCompare(a.date))[0]
      const value = parseFloat(((latestSnapshot?.price ?? 0) * position.shares).toFixed(2))
      entry[position.ticker] = value
      total += value
    }
    entry['Total'] = parseFloat(total.toFixed(2))
    return entry
  })

  const chartData = stockPositions
    .filter((s) => s.currentPrice > 0)
    .map((s, i) => ({
      name: s.ticker,
      value: parseFloat((s.shares * s.currentPrice).toFixed(2)),
      fill: COLORS[i % COLORS.length]
    }))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stocks</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshPrices} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh Prices'}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Position</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Position</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="ticker">Ticker</Label>
                <Input id="ticker" placeholder="e.g. AAPL" value={form.ticker}
                  onChange={(e) => setForm({ ...form, ticker: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="shares">Shares</Label>
                <Input id="shares" type="number" step="0.0001" placeholder="e.g. 10"
                  value={form.shares}
                  onChange={(e) => setForm({ ...form, shares: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="avgCostBasis">Avg Cost Per Share</Label>
                <Input id="avgCostBasis" type="number" step="0.01" placeholder="e.g. 150.00"
                  value={form.avgCostBasis}
                  onChange={(e) => setForm({ ...form, avgCostBasis: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="currentPrice">Current Price (optional)</Label>
                <Input id="currentPrice" type="number" step="0.01" placeholder="e.g. 175.00"
                  value={form.currentPrice}
                  onChange={(e) => setForm({ ...form, currentPrice: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input id="purchaseDate" type="date" value={form.purchaseDate}
                  onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Portfolio Value</CardDescription>
            <CardTitle className="text-3xl">${totalValue.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Total Cost</CardDescription>
            <CardTitle className="text-3xl">${totalCost.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Total P&L</CardDescription>
            <CardTitle className={`text-3xl ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Table + Chart */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card>
            <CardHeader><CardTitle>Positions</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Avg Cost</TableHead>
                    <TableHead>Current Price</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockPositions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No positions yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    stockPositions.map((s) => {
                      const pnl = (s.currentPrice - s.avgCostBasis) * s.shares
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-semibold">{s.ticker}</TableCell>
                          <TableCell>{s.shares}</TableCell>
                          <TableCell>${s.avgCostBasis.toFixed(2)}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              defaultValue={s.currentPrice || ''}
                              placeholder="Enter price"
                              className="w-28 h-7 text-sm"
                              onBlur={(e) => handlePriceChange(s, e.target.value)}
                            />
                          </TableCell>
                          <TableCell className={`text-right font-mono ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {s.currentPrice > 0 ? `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}` : '—'}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => deletePosition(s.id)}>
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Allocation chart */}
        <Card>
          <CardHeader><CardTitle>Allocation</CardTitle></CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center pt-8">
                Enter current prices to see allocation
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

      {/* Growth chart */}
      {priceSnapshots.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
            <CardTitle>Portfolio Growth</CardTitle>
            <div className="flex rounded-md border text-sm overflow-hidden w-fit">
              <button
                className={`px-3 py-1 transition-colors ${chartView === 'portfolio' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                onClick={() => setChartView('portfolio')}>
                Portfolio
              </button>
              <button
                className={`px-3 py-1 transition-colors ${chartView === 'individual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                onClick={() => setChartView('individual')}>
                Individual
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(val) => (typeof val === 'number' ? `$${val.toFixed(2)}` : val)} />
                <Legend />
                {chartView === 'portfolio' ? (
                  <Line type="monotone" dataKey="Total" stroke={COLORS[0]} dot={false} strokeWidth={2} />
                ) : (
                  stockPositions.map((s, i) => (
                    <Line key={s.ticker} type="monotone" dataKey={s.ticker} stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2} />
                  ))
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
