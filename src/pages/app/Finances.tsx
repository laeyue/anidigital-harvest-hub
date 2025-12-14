import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockFinances } from "@/lib/mockData";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
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

const Finances = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Finances</h1>
        <p className="text-muted-foreground">Track your income, expenses, and profits</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass" className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="flex items-center text-sm text-primary font-medium">
                <ArrowUpRight className="w-4 h-4" />
                18%
              </span>
            </div>
            <p className="text-2xl font-bold">KES {mockFinances.totalIncome.toLocaleString()}</p>
            <p className="text-muted-foreground text-sm">Total Income</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-destructive to-red-400 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <span className="flex items-center text-sm text-destructive font-medium">
                <ArrowDownRight className="w-4 h-4" />
                5%
              </span>
            </div>
            <p className="text-2xl font-bold">KES {mockFinances.totalExpenses.toLocaleString()}</p>
            <p className="text-muted-foreground text-sm">Total Expenses</p>
          </CardContent>
        </Card>

        <Card variant="gradient" className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-sunset flex items-center justify-center">
                <Wallet className="w-6 h-6 text-accent-foreground" />
              </div>
              <span className="flex items-center text-sm text-primary font-medium">
                <ArrowUpRight className="w-4 h-4" />
                25%
              </span>
            </div>
            <p className="text-2xl font-bold">KES {mockFinances.netProfit.toLocaleString()}</p>
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
              <BarChart data={mockFinances.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                  }}
                  formatter={(value: number) => [`KES ${value.toLocaleString()}`, ""]}
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
                {mockFinances.transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-4 px-4 text-muted-foreground">{transaction.date}</td>
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
                      {transaction.type === "income" ? "+" : ""}KES{" "}
                      {Math.abs(transaction.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Finances;
