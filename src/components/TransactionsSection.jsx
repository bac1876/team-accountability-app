import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Home, DollarSign, Calendar, Edit, Trash2, Check, X } from 'lucide-react'
import { transactionsStore } from '../utils/dataStore.js'
import { format } from 'date-fns'

const TransactionsSection = ({ user }) => {
  const [transactions, setTransactions] = useState([])
  const [monthlyStats, setMonthlyStats] = useState({ contracted: 0, closed: 0 })
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [newTransaction, setNewTransaction] = useState({
    address: '',
    purchasePrice: '',
    contractDate: '',
    closeDate: '',
    status: 'contracted'
  })

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  useEffect(() => {
    loadTransactions()
  }, [user?.id])

  const loadTransactions = () => {
    if (user?.id) {
      const allTransactions = transactionsStore.getUserTransactions(user.id)
      setTransactions(allTransactions)

      // Calculate monthly stats
      const monthlyData = transactionsStore.getMonthlyStats(user.id, currentYear, currentMonth)
      setMonthlyStats(monthlyData)
    }
  }

  const handleAddTransaction = () => {
    if (!newTransaction.address.trim() || !newTransaction.purchasePrice) {
      alert('Please fill in at least the address and purchase price')
      return
    }

    try {
      transactionsStore.addTransaction(user.id, {
        address: newTransaction.address,
        purchasePrice: parseFloat(newTransaction.purchasePrice),
        contractDate: newTransaction.contractDate || null,
        closeDate: newTransaction.closeDate || null,
        status: newTransaction.status
      })

      // Reset form
      setNewTransaction({
        address: '',
        purchasePrice: '',
        contractDate: '',
        closeDate: '',
        status: 'contracted'
      })

      loadTransactions()

      // Show success toast
      const successDiv = document.createElement('div')
      successDiv.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      successDiv.textContent = 'Transaction added successfully! ✓'
      document.body.appendChild(successDiv)
      setTimeout(() => successDiv.remove(), 2000)
    } catch (error) {
      console.error('Error adding transaction:', error)
      alert('Failed to add transaction. Please try again.')
    }
  }

  const handleUpdateTransaction = (transactionId, updates) => {
    transactionsStore.updateTransaction(user.id, transactionId, updates)
    setEditingTransaction(null)
    loadTransactions()
  }

  const handleDeleteTransaction = (transactionId) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      transactionsStore.deleteTransaction(user.id, transactionId)
      loadTransactions()
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const filterTransactionsByMonth = (status) => {
    return transactions.filter(t => {
      if (status === 'contracted' && t.contractDate) {
        // Parse date as local time to avoid timezone issues
        const [year, month, day] = t.contractDate.split('-').map(Number)
        return month - 1 === currentMonth && year === currentYear
      } else if (status === 'closed' && t.closeDate) {
        // Parse date as local time to avoid timezone issues
        const [year, month, day] = t.closeDate.split('-').map(Number)
        return month - 1 === currentMonth && year === currentYear
      }
      return false
    })
  }

  const contractedThisMonth = filterTransactionsByMonth('contracted')
  const closedThisMonth = filterTransactionsByMonth('closed')

  return (
    <div className="space-y-6">
      {/* Monthly Goal Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-800/50 backdrop-blur border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Home className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Contracted This Month</p>
                <p className="text-3xl font-bold text-white">{contractedThisMonth.length}</p>
                <p className="text-xs text-slate-500">Goal: 2 transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Closed This Month</p>
                <p className="text-3xl font-bold text-white">{closedThisMonth.length}</p>
                <p className="text-xs text-slate-500">Goal: 2 transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Transaction */}
      <Card className="bg-slate-800/50 backdrop-blur border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Add New Transaction</CardTitle>
          <CardDescription className="text-slate-400">Track your contracted and closed properties</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Property Address *</Label>
              <Input
                placeholder="123 Main St, City, State 12345"
                value={newTransaction.address}
                onChange={(e) => setNewTransaction({...newTransaction, address: e.target.value})}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Purchase Price *</Label>
              <Input
                type="number"
                placeholder="250000"
                value={newTransaction.purchasePrice}
                onChange={(e) => setNewTransaction({...newTransaction, purchasePrice: e.target.value})}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Contract Date</Label>
              <Input
                type="date"
                value={newTransaction.contractDate}
                onChange={(e) => setNewTransaction({...newTransaction, contractDate: e.target.value})}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Close Date</Label>
              <Input
                type="date"
                value={newTransaction.closeDate}
                onChange={(e) => setNewTransaction({...newTransaction, closeDate: e.target.value})}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <Button onClick={handleAddTransaction} className="w-full">
            Add Transaction
          </Button>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="bg-slate-800/50 backdrop-blur border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Your Transactions</CardTitle>
          <CardDescription className="text-slate-400">
            {format(currentDate, 'MMMM yyyy')} - View by contract or close date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="contracted" className="space-y-4">
            <TabsList className="bg-slate-700/50">
              <TabsTrigger value="contracted" className="data-[state=active]:bg-blue-600">
                Contracted ({contractedThisMonth.length})
              </TabsTrigger>
              <TabsTrigger value="closed" className="data-[state=active]:bg-green-600">
                Closed ({closedThisMonth.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-slate-600">
                All ({transactions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contracted" className="space-y-3">
              {contractedThisMonth.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No transactions contracted this month</p>
              ) : (
                contractedThisMonth.map(transaction => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    editing={editingTransaction === transaction.id}
                    onEdit={() => setEditingTransaction(transaction.id)}
                    onCancelEdit={() => setEditingTransaction(null)}
                    onUpdate={handleUpdateTransaction}
                    onDelete={handleDeleteTransaction}
                    formatCurrency={formatCurrency}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="closed" className="space-y-3">
              {closedThisMonth.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No transactions closed this month</p>
              ) : (
                closedThisMonth.map(transaction => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    editing={editingTransaction === transaction.id}
                    onEdit={() => setEditingTransaction(transaction.id)}
                    onCancelEdit={() => setEditingTransaction(null)}
                    onUpdate={handleUpdateTransaction}
                    onDelete={handleDeleteTransaction}
                    formatCurrency={formatCurrency}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No transactions yet</p>
              ) : (
                transactions.map(transaction => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    editing={editingTransaction === transaction.id}
                    onEdit={() => setEditingTransaction(transaction.id)}
                    onCancelEdit={() => setEditingTransaction(null)}
                    onUpdate={handleUpdateTransaction}
                    onDelete={handleDeleteTransaction}
                    formatCurrency={formatCurrency}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Transaction Card Component
const TransactionCard = ({ transaction, editing, onEdit, onCancelEdit, onUpdate, onDelete, formatCurrency }) => {
  const [editData, setEditData] = useState({
    address: transaction.address,
    purchasePrice: transaction.purchasePrice,
    contractDate: transaction.contractDate || '',
    closeDate: transaction.closeDate || ''
  })

  if (editing) {
    return (
      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Address</Label>
            <Input
              value={editData.address}
              onChange={(e) => setEditData({...editData, address: e.target.value})}
              className="bg-slate-600 border-slate-500 text-white text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Purchase Price</Label>
            <Input
              type="number"
              value={editData.purchasePrice}
              onChange={(e) => setEditData({...editData, purchasePrice: e.target.value})}
              className="bg-slate-600 border-slate-500 text-white text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Contract Date</Label>
            <Input
              type="date"
              value={editData.contractDate}
              onChange={(e) => setEditData({...editData, contractDate: e.target.value})}
              className="bg-slate-600 border-slate-500 text-white text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Close Date</Label>
            <Input
              type="date"
              value={editData.closeDate}
              onChange={(e) => setEditData({...editData, closeDate: e.target.value})}
              className="bg-slate-600 border-slate-500 text-white text-sm"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={() => onUpdate(transaction.id, {
              ...editData,
              purchasePrice: parseFloat(editData.purchasePrice)
            })}
            className="h-8"
          >
            <Check className="h-3 w-3 mr-1" />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancelEdit}
            className="h-8"
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:bg-slate-700/70 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-start space-x-3">
            <Home className="h-5 w-5 text-blue-400 mt-1" />
            <div className="flex-1">
              <p className="font-medium text-white">{transaction.address}</p>
              <p className="text-lg font-bold text-green-400">{formatCurrency(transaction.purchasePrice)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs">Contract Date</p>
              <p className="text-white">
                {transaction.contractDate ? (() => {
                  const [year, month, day] = transaction.contractDate.split('-').map(Number)
                  const localDate = new Date(year, month - 1, day)
                  return format(localDate, 'MMM d, yyyy')
                })() : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Close Date</p>
              <p className="text-white">
                {transaction.closeDate ? (() => {
                  const [year, month, day] = transaction.closeDate.split('-').map(Number)
                  const localDate = new Date(year, month - 1, day)
                  return format(localDate, 'MMM d, yyyy')
                })() : 'Not set'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className="h-8 w-8 p-0 hover:bg-blue-500/20"
          >
            <Edit className="h-4 w-4 text-blue-400" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(transaction.id)}
            className="h-8 w-8 p-0 hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TransactionsSection
