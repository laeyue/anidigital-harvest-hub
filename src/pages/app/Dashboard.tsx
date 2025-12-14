import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockUser, mockDashboardStats, mockWeather } from "@/lib/mockData";
import {
  TrendingUp,
  ShoppingBasket,
  Clock,
  Users,
  CloudSun,
  Droplets,
  Wind,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  CreditCard,
  Bell,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const activityIcons = {
  sale: ShoppingCart,
  listing: Package,
  alert: Bell,
  order: ShoppingBasket,
  payment: CreditCard,
};

const Dashboard = () => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card variant="gradient" className="overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {greeting}, {mockUser.name.split(" ")[0]}! 👋
              </h1>
              <p className="text-muted-foreground">
                Here's what's happening with your farm today.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="hero" asChild>
                <Link to="/app/marketplace">
                  View Marketplace
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="flex items-center text-sm text-primary font-medium">
                <ArrowUpRight className="w-4 h-4" />
                12%
              </span>
            </div>
            <p className="text-2xl font-bold">KES {mockDashboardStats.totalSales.toLocaleString()}</p>
            <p className="text-muted-foreground text-sm">Total Sales</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-sunset flex items-center justify-center">
                <ShoppingBasket className="w-6 h-6 text-accent-foreground" />
              </div>
              <span className="flex items-center text-sm text-primary font-medium">
                <ArrowUpRight className="w-4 h-4" />
                3
              </span>
            </div>
            <p className="text-2xl font-bold">{mockDashboardStats.activeListings}</p>
            <p className="text-muted-foreground text-sm">Active Listings</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="flex items-center text-sm text-accent font-medium">
                <ArrowDownRight className="w-4 h-4" />
                2
              </span>
            </div>
            <p className="text-2xl font-bold">{mockDashboardStats.pendingOrders}</p>
            <p className="text-muted-foreground text-sm">Pending Orders</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="flex items-center text-sm text-primary font-medium">
                <ArrowUpRight className="w-4 h-4" />
                8
              </span>
            </div>
            <p className="text-2xl font-bold">{mockDashboardStats.totalBuyers}</p>
            <p className="text-muted-foreground text-sm">Total Buyers</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weather Widget */}
        <Card variant="dark" className="lg:row-span-2 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CloudSun className="w-5 h-5" />
              Weather Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-white mb-2">
                {mockWeather.current.temp}°C
              </div>
              <p className="text-white/80">{mockWeather.current.condition}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <Droplets className="w-5 h-5 mx-auto mb-2 text-cyan-400" />
                <p className="text-white text-lg font-semibold">{mockWeather.current.humidity}%</p>
                <p className="text-white/60 text-sm">Humidity</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <Wind className="w-5 h-5 mx-auto mb-2 text-white/80" />
                <p className="text-white text-lg font-semibold">{mockWeather.current.windSpeed} km/h</p>
                <p className="text-white/60 text-sm">Wind Speed</p>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {mockWeather.forecast.slice(0, 5).map((day, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-[60px] bg-white/10 rounded-xl p-3 text-center"
                >
                  <p className="text-white/60 text-xs mb-1">{day.day}</p>
                  <p className="text-white font-semibold">{day.high}°</p>
                  <p className="text-white/40 text-sm">{day.low}°</p>
                </div>
              ))}
            </div>

            <Button variant="glass" className="w-full mt-4 text-white border-white/20" asChild>
              <Link to="/app/climate-advisory">
                View Full Forecast
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card variant="glass" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockDashboardStats.recentActivity.map((activity) => {
                const Icon = activityIcons[activity.type as keyof typeof activityIcons];
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{activity.message}</p>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card variant="glass" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto flex-col py-6 gap-3"
                asChild
              >
                <Link to="/app/marketplace">
                  <ShoppingBasket className="w-6 h-6" />
                  <span>Sell Item</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col py-6 gap-3"
                asChild
              >
                <Link to="/app/crop-doctor">
                  <Package className="w-6 h-6" />
                  <span>Diagnose Crop</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col py-6 gap-3"
                asChild
              >
                <Link to="/app/climate-advisory">
                  <CloudSun className="w-6 h-6" />
                  <span>Check Weather</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col py-6 gap-3"
                asChild
              >
                <Link to="/app/finances">
                  <CreditCard className="w-6 h-6" />
                  <span>Add Transaction</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
