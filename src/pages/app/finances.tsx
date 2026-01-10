
import { GetServerSideProps } from "next";
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
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  FileDown,
  Target,
  PieChart as PieChartIcon
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category?: string | null;
}

const EXPENSE_CATEGORIES = [
  { value: 'labor', label: 'Labor' },
  { value: 'overhead', label: 'Overhead' },
  { value: 'materials', label: 'Materials' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
];

const COLORS = {
  labor: '#8884d8',
  overhead: '#82ca9d',
  materials: '#ffc658',
  equipment: '#ff7300',
  utilities: '#0088fe',
  other: '#ff6b6b',
};

const Finances = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  interface MonthlyDataItem {
    month: string;
    income: number;
    expenses: number;
  }
  interface ExpenseItem {
    category: string;
    amount: number;
  }
  const [monthlyData, setMonthlyData] = useState<MonthlyDataItem[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseItem[]>([]);
  const [targetSales, setTargetSales] = useState<number | null>(null);
  const [isTargetDialogOpen, setIsTargetDialogOpen] = useState(false);
  const [targetSalesInput, setTargetSalesInput] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '' as string,
  });

  const loadTargetSales = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('target_sales')
      .eq('id', user.id)
      .single();
    
    if (data?.target_sales) {
      setTargetSales(data.target_sales);
      setTargetSalesInput(data.target_sales.toString());
    }
  }, [user]);

  const loadTransactions = useCallback(async () => {
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
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      loadTransactions();
      loadTargetSales();
    }
  }, [user, loadTransactions, loadTargetSales]);

  const calculateStats = (transactions: Transaction[]) => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    setTotalIncome(income);
    setTotalExpenses(expenses);

    // Calculate expense breakdown by category
    const breakdown: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'other';
        breakdown[cat] = (breakdown[cat] || 0) + Number(t.amount);
      });

    setExpenseBreakdown(
      Object.entries(breakdown).map(([name, value]) => ({
        category: EXPENSE_CATEGORIES.find(c => c.value === name)?.label || 'Uncategorized',
        amount: Math.round(value),
      }))
    );

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

    if (formData.type === 'expense' && !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please select an expense category",
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
        category: formData.type === 'expense' ? formData.category : null,
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
      description: `${formData.type === 'income' ? 'Sales/Revenue' : 'Expense'} added successfully`,
    });

    // Reset form
    setFormData({
      type: 'expense',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
    });

    setIsAddDialogOpen(false);
    setIsAdding(false);

    // Reload transactions
    loadTransactions();
  };

  const handleSaveTargetSales = async () => {
    if (!user) return;

    const target = parseFloat(targetSalesInput);
    if (isNaN(target) || target < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid target sales amount",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ target_sales: target })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating target sales:', error);
      toast({
        title: "Error",
        description: "Failed to update target sales",
        variant: "destructive",
      });
      return;
    }

    setTargetSales(target);
    setIsTargetDialogOpen(false);
    toast({
      title: "Success",
      description: "Target sales updated successfully",
    });
  };

  const generateBIRStatement = () => {
    if (!user) return;

    // Get user profile for business name
    supabase
      .from('profiles')
      .select('name, location')
      .eq('id', user.id)
      .single()
      .then(({ data: profile }) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let yPos = margin;

        // Header
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('FINANCIAL STATEMENT', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('For Bank Loan Application', pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        // Business Information
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Business Information:', margin, yPos);
        yPos += 7;

        doc.setFont('helvetica', 'normal');
        doc.text(`Business Name: ${profile?.name || 'N/A'}`, margin, yPos);
        yPos += 7;
        doc.text(`Location: ${profile?.location || 'N/A'}`, margin, yPos);
        yPos += 7;
        doc.text(`Statement Period: ${new Date().getFullYear()}`, margin, yPos);
        yPos += 15;

        // Income Statement
        doc.setFont('helvetica', 'bold');
        doc.text('INCOME STATEMENT', margin, yPos);
        yPos += 10;

        doc.setFont('helvetica', 'normal');
        doc.text(`Total Sales/Revenue: PHP ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPos);
        yPos += 7;

        // Expense Breakdown
        doc.text('Less: Operating Expenses', margin, yPos);
        yPos += 7;
        expenseBreakdown.forEach(cat => {
          doc.text(`  ${cat.category}: PHP ${cat.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + 5, yPos);
          yPos += 6;
          if (yPos > 250) {
            doc.addPage();
            yPos = margin;
          }
        });

        const otherExpenses = totalExpenses - expenseBreakdown.reduce((sum, cat) => sum + cat.amount, 0);
        if (otherExpenses > 0) {
          doc.text(`  Other Expenses: PHP ${otherExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + 5, yPos);
          yPos += 7;
        }

        doc.text(`Total Expenses: PHP ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPos);
        yPos += 10;

        // Net Income
        const netIncome = totalIncome - totalExpenses;
        doc.setFont('helvetica', 'bold');
        doc.text(`Net Income: PHP ${netIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPos);
        yPos += 15;

        // Summary
        doc.setFont('helvetica', 'bold');
        doc.text('SUMMARY', margin, yPos);
        yPos += 10;

        doc.setFont('helvetica', 'normal');
        doc.text(`Total Sales/Revenue: PHP ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPos);
        yPos += 7;
        doc.text(`Total Expenses: PHP ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'bold');
        doc.text(`Net Profit: PHP ${netIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPos);
        yPos += 15;

        if (targetSales) {
          const progress = (totalIncome / targetSales) * 100;
          doc.setFont('helvetica', 'normal');
          doc.text(`Target Sales: PHP ${targetSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPos);
          yPos += 7;
          doc.text(`Progress: ${progress.toFixed(1)}%`, margin, yPos);
          yPos += 10;
        }

        // Footer
        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(
            `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} - Page ${i} of ${totalPages}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        }

        // Save PDF
        doc.save(`Financial-Statement-${new Date().getFullYear()}.pdf`);
        toast({
          title: "Success",
          description: "Financial statement generated successfully",
        });
      });
  };

  const salesProgress = targetSales ? (totalIncome / targetSales) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Finances</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Track your sales, expenses, and profits</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={isTargetDialogOpen} onOpenChange={setIsTargetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 sm:flex-initial">
                <Target className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Set Target</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Target Sales/Revenue</DialogTitle>
                <DialogDescription>
                  Set your annual target sales/revenue amount for tracking progress
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="target">Target Sales/Revenue (PHP)</Label>
                  <Input
                    id="target"
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={targetSalesInput}
                    onChange={(e) => setTargetSalesInput(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTargetDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="hero" onClick={handleSaveTargetSales}>
                  Save Target
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={generateBIRStatement} className="flex-1 sm:flex-initial">
            <FileDown className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Export BIR Statement</span>
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" className="flex-1 sm:flex-initial">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Transaction</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] m-4 flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>
                  Record a new sales/revenue or expense transaction
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide -mx-2 px-2 pb-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => {
                      setFormData({ 
                        ...formData, 
                        type: value as 'income' | 'expense',
                        category: value === 'expense' ? formData.category : ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Sales/Revenue</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === 'expense' && (
                  <div className="space-y-2">
                    <Label htmlFor="category">Expense Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder={formData.type === 'income' ? "e.g., Crop sale, Product sales" : "e.g., Seed purchase, Equipment maintenance"}
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
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <Card variant="glass" className="p-12 text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading finances...</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card variant="glass" className="hover-lift">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-emerald flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold break-words">PHP {totalIncome.toLocaleString()}</p>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">Total Sales/Revenue</p>
              </CardContent>
            </Card>

            <Card variant="glass" className="hover-lift">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-destructive to-red-400 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold break-words">PHP {totalExpenses.toLocaleString()}</p>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">Total Expenses</p>
              </CardContent>
            </Card>

            <Card variant="gradient" className="hover-lift sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-accent to-sunset flex items-center justify-center">
                    <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-accent-foreground" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold break-words">PHP {(totalIncome - totalExpenses).toLocaleString()}</p>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">Net Profit</p>
              </CardContent>
            </Card>
          </div>

          {/* Target Sales Progress */}
          {targetSales && (
            <Card variant="glass">
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                  Target Sales Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm">
                    <span className="text-muted-foreground">Current Sales</span>
                    <span className="font-semibold break-words text-right sm:text-left">PHP {totalIncome.toLocaleString()} / PHP {targetSales.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 sm:h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-emerald transition-all duration-500"
                      style={{ width: `${Math.min(salesProgress, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className={`font-semibold ${salesProgress >= 100 ? 'text-primary' : ''}`}>
                      {salesProgress.toFixed(1)}%
                    </span>
                  </div>
                  {salesProgress < 100 && (
                    <p className="text-xs text-muted-foreground break-words">
                      PHP {(targetSales - totalIncome).toLocaleString()} remaining to reach target
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Income vs Expenses Chart */}
            <Card variant="glass">
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Sales/Revenue vs Expenses</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        stroke="hsl(var(--muted-foreground))" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        tick={{ fontSize: 12 }}
                        width={50}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [`PHP ${value.toLocaleString()}`, ""]}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="income" fill="hsl(152 60% 42%)" radius={[4, 4, 0, 0]} name="Sales/Revenue" />
                      <Bar dataKey="expenses" fill="hsl(35 80% 55%)" radius={[4, 4, 0, 0]} name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            {totalExpenses > 0 && (
              <Card variant="glass">
                <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    Expense Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  {expenseBreakdown.length > 0 ? (
                    <div className="h-64 sm:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseBreakdown}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="amount"
                          >
                            {expenseBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[entry.category as keyof typeof COLORS] || COLORS.other} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => `PHP ${value.toLocaleString()}`}
                            contentStyle={{ fontSize: "12px" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 sm:h-80 flex items-center justify-center text-center p-4">
                      <div>
                        <PieChartIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                          Add expense categories to see breakdown
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Transactions Table */}
          <Card variant="glass">
            <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {/* Mobile Card View */}
              <div className="block sm:hidden divide-y divide-border">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
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
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className={`text-sm font-semibold ${
                            transaction.type === "income" ? "text-primary" : "text-destructive"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : ""}PHP{" "}
                          {Math.abs(transaction.amount).toLocaleString()}
                        </p>
                        {transaction.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground inline-block mt-1">
                            {EXPENSE_CATEGORIES.find(c => c.value === transaction.category)?.label || transaction.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No transactions yet
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Category</th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-sm">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-4 px-4 text-muted-foreground text-sm">
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
                            <span className="font-medium text-sm">{transaction.description}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {transaction.category ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              {EXPENSE_CATEGORIES.find(c => c.value === transaction.category)?.label || transaction.category}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                        <td
                          className={`py-4 px-4 text-right font-semibold text-sm ${
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
                {transactions.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No transactions yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Finances;

// Force dynamic rendering to prevent static generation
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};

