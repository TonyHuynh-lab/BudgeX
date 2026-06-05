import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Subscriptions from './pages/Subscriptions'
import Stocks from './pages/Stocks'
import Savings from './pages/Savings'

function App(): React.JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="stocks" element={<Stocks />} />
          <Route path="savings" element={<Savings />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
