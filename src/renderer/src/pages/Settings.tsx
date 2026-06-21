import { useEffect, useState } from 'react'
import { useSettings, type Settings as SettingsType } from '../store/index'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { formatCurrency } from '../lib/utils'

const THEME_OPTIONS: { value: SettingsType['theme']; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
]

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'CHF', label: 'Swiss Franc' },
  { code: 'CNY', label: 'Chinese Yuan' },
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'MXN', label: 'Mexican Peso' }
]

const RESET_PHRASE = 'DELETE'

export default function Settings(): React.JSX.Element {
  const { settings, load, update } = useSettings()
  const [dbPath, setDbPath] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    load()
    window.api.appInfo.get().then(({ dbPath }) => setDbPath(dbPath))
  }, [])

  const handleExport = async (): Promise<void> => {
    try {
      const result = await window.api.data.export()
      if (!result.canceled) window.alert(`Exported to ${result.filePath}`)
    } catch (error) {
      window.alert(`Export failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleReset = async (): Promise<void> => {
    setResetting(true)
    try {
      await window.api.data.reset()
      window.location.reload()
    } catch (error) {
      window.alert(`Reset failed: ${error instanceof Error ? error.message : String(error)}`)
      setResetting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {!settings ? (
        <p className="text-sm text-muted-foreground">Loading settings…</p>
      ) : (
        <div className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Choose how Budgex looks. Changes apply immediately.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex rounded-md border text-sm overflow-hidden w-fit">
                {THEME_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`px-4 py-1.5 transition-colors ${
                      settings.theme === value
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                    onClick={() => update({ theme: value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Currency &amp; Format</CardTitle>
              <CardDescription>
                Used as the default for new accounts and for every amount shown across the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="currency">Default currency</Label>
              <Select value={settings.currency} onValueChange={(v) => update({ currency: v })}>
                <SelectTrigger id="currency" className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Preview: {formatCurrency(1234.56, settings.currency)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data</CardTitle>
              <CardDescription>Your data lives only on this device — nothing is sent anywhere.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Database location</Label>
                <div className="rounded-lg border bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground break-all">
                  {dbPath || '—'}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Export all data</Label>
                  <p className="text-sm text-muted-foreground">Save everything as a JSON file.</p>
                </div>
                <Button variant="outline" onClick={handleExport}>
                  Export all data
                </Button>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <Label>Reset all data</Label>
                  <p className="text-sm text-muted-foreground">Permanently delete everything. This can&apos;t be undone.</p>
                </div>
                <Button variant="destructive" onClick={() => setResetOpen(true)}>
                  Reset all data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog
        open={resetOpen}
        onOpenChange={(o) => {
          setResetOpen(o)
          if (!o) setConfirmText('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset all data?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This permanently deletes every account, transaction, subscription, stock position, savings
            goal, and cashback rate. This can&apos;t be undone.
          </p>
          <div className="space-y-1">
            <Label htmlFor="confirmReset">
              Type {RESET_PHRASE} to confirm
            </Label>
            <Input
              id="confirmReset"
              placeholder={RESET_PHRASE}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Keep my data</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={confirmText !== RESET_PHRASE || resetting}
              onClick={handleReset}
            >
              {resetting ? 'Deleting…' : 'Delete everything'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
