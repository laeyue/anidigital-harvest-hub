import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Plus } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
}

const Finances = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } else {
      setTransactions(data || []);
      calculateStats(data || []);
    }
    setIsLoading(false);
  };

  const calculateStats = (transactions: Transaction[]) => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    setTotalIncome(income);
    setTotalExpenses(expenses);

    // Group by month and year
    const monthly: Record<string, { income: number; expenses: number; date: Date }> = {};
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthly[monthKey]) {
        monthly[monthKey] = { income: 0, expenses: 0, date };
      }
      if (t.type === 'income') {
        monthly[monthKey].income += Number(t.amount);
      } else {
        monthly[monthKey].expenses += Number(t.amount);
      }
    });

    // Sort by date and format for display
    setMonthlyData(Object.entries(monthly)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        date: data.date,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(({ month, income, expenses }) => ({
        month,
        income,
        expenses,
      })));
  };

  const handleAddTransaction = async () => {
    if (!user) return;

    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a description",
        variant: "destructive",
      });
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (!formData.date) {
      toast({
        title: "Validation Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: formData.type,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        date: formData.date,
      });

    if (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
      setIsAdding(false);
      return;
    }

    toast({
      title: "Success",
      description: `${formData.type === 'income' ? 'Income' : 'Expense'} added successfully`,
    });

    // Reset form
    setFormData({
      type: 'expense',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
    });

    setIsAddDialogOpen(false);
    setIsAdding(false);

    // Reload transactions
    loadTransactions();
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Finances</h1>
          <p className="text-muted-foreground">Track your income, expenses, and profits</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] m-4 flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Add Transaction</DialogTitle>
              <DialogDescription>
                Record a new income or expense transaction
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide -mx-2 px-2 pb-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as 'income' | 'expense' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., Seed purchase, Crop sale, Equipment maintenance"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (PHP)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="hero" onClick={handleAddTransaction} disabled={isAdding}>
                {isAdding ? "Adding..." : "Add Transaction"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <Card variant="glass" className="p-12 text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading finances...</p>
        </Card>
      ) : (
        <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card variant="glass" className="hover-lift">
           <CardContent className="p-6">
             <div className="flex items-center justify-between mb-4">
               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald flex items-center justify-center">
                 <TrendingUp className="w-6 h-6 text-primary-foreground" />
               </div>
             </div>
             <p className="text-2xl font-bold">PHP {totalIncome.toLocaleString()}</p>
             <p className="text-muted-foreground text-sm">Total Income</p>
           </CardContent>
         </Card>

         <Card variant="glass" className="hover-lift">
           <CardContent className="p-6">
             <div className="flex items-center justify-between mb-4">
               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-destructive to-red-400 flex items-center justify-center">
                 <TrendingDown className="w-6 h-6 text-white" />
               </div>
             </div>
             <p className="text-2xl font-bold">PHP {totalExpenses.toLocaleString()}</p>
             <p className="text-muted-foreground text-sm">Total Expenses</p>
           </CardContent>
         </Card>

         <Card variant="gradient" className="hover-lift">
           <CardContent className="p-6">
             <div className="flex items-center justify-between mb-4">
               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-sunset flex items-center justify-center">
                 <Wallet className="w-6 h-6 text-accent-foreground" />
               </div>
             </div>
             <p className="text-2xl font-bold">PHP {(totalIncome - totalExpenses).toLocaleString()}</p>
             <p className="text-muted-foreground text-sm">Net Profit</p>
           </CardContent>
         </Card>
      </div>

      {/* Chart */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                  }}
                  formatter={(value: number) => [`PHP ${value.toLocaleString()}`, ""]}
                />
                <Legend />
                <Bar dataKey="income" fill="hsl(152 60% 42%)" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill="hsl(35 80% 55%)" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Description</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-4 px-4 text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            transaction.type === "income"
                              ? "bg-primary/10 text-primary"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {transaction.type === "income" ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                        <span className="font-medium">{transaction.description}</span>
                      </div>
                    </td>
                    <td
                      className={`py-4 px-4 text-right font-semibold ${
                        transaction.type === "income" ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : ""}PHP{" "}
                      {Math.abs(transaction.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
};

export default Finances;
