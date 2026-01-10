import { GetServerSideProps } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  ShoppingBasket,
  Clock,
  Users,
  CloudSun,
  Cloud,
  CloudRain,
  Sun,
  Droplets,
  Wind,
  ArrowUpRight,
  Package,
  CreditCard,
  Bell,
  ShoppingCart,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  getCurrentWeather,
  getDailyForecast,
  createPolygon,
  isApiConfigured,
} from "@/lib/agromonitoring";

interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  dt: number;
}

interface ForecastDay {
  dt: number;
  temp: {
    day: number;
    min: number;
    max: number;
  };
  weather: Array<{
    main: string;
    icon: string;
  }>;
  humidity: number;
  wind_speed: number;
  pressure: number;
  rain?: number | { '3h': number };
}

const weatherIcons: Record<string, React.ElementType> = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudRain,
  Thunderstorm: CloudRain,
  Snow: Cloud,
  Mist: CloudSun,
  Fog: CloudSun,
  Haze: CloudSun,
};

interface Profile {
  id: string;
  name?: string;
  location?: string;
}

interface Activity {
  id: string;
  type: string;
  kind?: "transaction" | "notification";
  amount?: number;
  description?: string;
  created_at: string;
  title?: string;
  message?: string;
  read?: boolean;
}

interface ForecastDay {
  dt: number;
  temp: { day: number; min: number; max: number };
  weather: Array<{ main: string; icon: string }>;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    activeListings: 0,
    pendingOrders: 0,
    totalBuyers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<{ list: ForecastDay[] } | null>(null);
  const [weatherLocation, setWeatherLocation] = useState("");
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);

    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(profileData);

    // Calculate stats from products, chat-based orders, and transactions
    const [
      productsResult,
      chatOrdersResult,
      transactionsResult,
      recentTransactionsResult,
      notificationsResult,
    ] = await Promise.all([
      supabase.from("products").select("id, quantity").eq("seller_id", user.id),
      supabase
        .from("chat_orders")
        .select("buyer_id, seller_id, status, total_amount")
        .eq("seller_id", user.id),
      supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", user.id)
        .eq("type", "income"),
      supabase
        .from("transactions")
        .select("id, type, amount, created_at, description")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("notifications")
        .select("id, title, message, type, created_at, read")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    interface ChatOrder {
      buyer_id: string;
      seller_id: string;
      status: string;
      total_amount: number;
    }
    const orders = (chatOrdersResult.data as ChatOrder[]) || [];
    const paidOrders = orders.filter((o) => o.status === "paid");
    const pendingOrdersCount = orders.filter((o) => o.status !== "paid").length;
    const buyerIds = new Set(orders.map((o) => o.buyer_id));

    const totalSalesFromOrders =
      paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;

    interface Transaction {
      amount: number;
      type: string;
    }
    const totalSalesFromTransactions =
      transactionsResult.data?.reduce((sum, t) => sum + Number((t as Transaction).amount), 0) || 0;

    const totalSales = totalSalesFromOrders || totalSalesFromTransactions;

    interface Product {
      quantity?: number;
    }
    const activeListings =
      productsResult.data?.filter((p: Product) => Number(p.quantity || 0) > 0).length || 0;

    setStats({
      totalSales,
      activeListings,
      pendingOrders: pendingOrdersCount,
      totalBuyers: buyerIds.size,
    });

    // Build recent activity list from notifications + transactions
    interface RecentTransaction {
      id: string;
      type: string;
      amount: number;
      description?: string;
      created_at: string;
    }
    const txActivities: Activity[] =
      recentTransactionsResult.data?.map((tx: RecentTransaction) => ({
        id: `tx-${tx.id}`,
        kind: "transaction" as const,
        type: tx.type,
        amount: tx.amount,
        description: tx.description ||
          `${tx.type === "income" ? "Income" : "Expense"} of PHP ${Number(
            tx.amount
          ).toLocaleString()}`,
        created_at: tx.created_at,
      })) || [];

    interface RecentNotification {
      id: string;
      title?: string;
      message?: string;
      type?: string;
      created_at: string;
      read?: boolean;
    }
    const notifActivities: Activity[] =
      notificationsResult.data?.map((n: RecentNotification) => ({
        id: `notif-${n.id}`,
        kind: "notification" as const,
        type: n.type || "info",
        title: n.title || "Notification",
        message: n.message || "",
        created_at: n.created_at,
        read: n.read,
      })) || [];

    const merged = [...txActivities, ...notifActivities].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setRecentActivities(merged.slice(0, 8));

    setIsLoading(false);
  }, [user]);

  const loadWeatherData = useCallback(async () => {
    if (!user || !isApiConfigured()) {
      return;
    }

    setIsLoadingWeather(true);

    try {
      // Load user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('location, polygon_id, name')
        .eq('id', user.id)
        .single();

      if (!profileData || !profileData.location) {
        setIsLoadingWeather(false);
        return;
      }

      setWeatherLocation(profileData.location);

      let polygonId = profileData.polygon_id;

      // Create polygon if it doesn't exist
      if (!polygonId) {
        polygonId = await createPolygon(profileData.location, `${profileData.name || 'Farm'} Location`);
        if (polygonId) {
          await supabase
            .from('profiles')
            .update({ polygon_id: polygonId })
            .eq('id', user.id);
        }
      }

      if (!polygonId) {
        setIsLoadingWeather(false);
        return;
      }

      // Fetch weather data
      const [weatherData, forecastData] = await Promise.all([
        getCurrentWeather(polygonId),
        getDailyForecast(polygonId),
      ]);

      if (weatherData) {
        setCurrentWeather(weatherData);
      }

      if (forecastData) {
        interface ForecastItem {
          dt: number;
          main?: {
            temp: number;
            temp_min: number;
            temp_max: number;
            humidity: number;
            pressure: number;
          };
          temp?: number | { min: number; max: number; day: number };
          weather?: Array<{ main: string; icon: string }>;
          humidity?: number;
          wind_speed?: number;
          wind?: { speed: number };
          pressure?: number;
          rain?: number | { '3h': number };
          precipitation?: number | { '3h': number };
        }
        let forecastList: ForecastItem[] | null = null;
        
        if (forecastData.list && Array.isArray(forecastData.list)) {
          forecastList = forecastData.list as ForecastItem[];
        } else if (forecastData.data && Array.isArray(forecastData.data)) {
          forecastList = forecastData.data as ForecastItem[];
        } else if (Array.isArray(forecastData)) {
          forecastList = forecastData as ForecastItem[];
        } else if (forecastData.forecast && Array.isArray(forecastData.forecast)) {
          forecastList = forecastData.forecast as ForecastItem[];
        }
        
        if (forecastList && forecastList.length > 0) {
          const dailyForecasts: Array<{
            dt: number;
            temp: { day: number; min: number; max: number };
            weather: Array<{ main: string; icon: string }>;
            humidity: number;
            wind_speed: number;
            pressure: number;
            rain?: number | { '3h': number };
          }> = [];
          const seenDays = new Set<string>();
          
          forecastList.forEach((item) => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();
            
            if (!seenDays.has(dayKey)) {
              seenDays.add(dayKey);
              // Extract temperature values handling both number and object types
              const tempValue = item.main?.temp ?? (typeof item.temp === 'number' ? item.temp : item.temp?.day ?? 0);
              const tempMin = item.main?.temp_min ?? (typeof item.temp === 'object' && item.temp !== null ? item.temp.min : tempValue);
              const tempMax = item.main?.temp_max ?? (typeof item.temp === 'object' && item.temp !== null ? item.temp.max : tempValue);
              
              dailyForecasts.push({
                dt: item.dt,
                temp: {
                  day: tempValue,
                  min: tempMin,
                  max: tempMax,
                },
                weather: item.weather || [{ main: 'Clear', icon: '01d' }],
                humidity: item.main?.humidity || item.humidity,
                wind_speed: item.wind?.speed || item.wind_speed,
                pressure: item.main?.pressure || item.pressure,
                rain: item.rain || item.precipitation,
              });
            } else {
              const existingDay = dailyForecasts[dailyForecasts.length - 1];
              const temp = item.main?.temp || item.temp;
              if (typeof temp === 'number') {
                existingDay.temp.min = Math.min(existingDay.temp.min, temp);
                existingDay.temp.max = Math.max(existingDay.temp.max, temp);
              }
            }
          });
          
          setForecast({ list: dailyForecasts.slice(0, 5) });
        }
      }
    } catch (error) {
      console.error('Error loading weather data:', error);
      }

    setIsLoadingWeather(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadWeatherData();
    }
  }, [user, loadDashboardData, loadWeatherData]);

  const getWeatherIcon = (weatherMain: string) => {
    return weatherIcons[weatherMain] || CloudSun;
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const userName = profile?.name?.split(" ")[0] || "Farmer";

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card variant="gradient" className="overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {greeting}, {userName}! 👋
              </h1>
              <p className="text-muted-foreground">
                Here&apos;s what&apos;s happening with your farm today.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="hero" asChild>
                <Link href="/app/marketplace">
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
            </div>
            <p className="text-2xl font-bold">PHP {stats.totalSales.toLocaleString()}</p>
            <p className="text-muted-foreground text-sm">Total Sales</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-sunset flex items-center justify-center">
                <ShoppingBasket className="w-6 h-6 text-accent-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.activeListings}</p>
            <p className="text-muted-foreground text-sm">Active Listings</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.pendingOrders}</p>
            <p className="text-muted-foreground text-sm">Pending Orders</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.totalBuyers}</p>
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
            {isLoadingWeather ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/60 text-sm">Loading weather...</p>
              </div>
            ) : !isApiConfigured() ? (
              <div className="text-center py-8">
                <CloudSun className="w-16 h-16 mx-auto text-white/40 mb-4" />
                <p className="text-white/60 text-sm mb-4">
                  API key required
                </p>
                <Button variant="glass" className="w-full mt-4 text-white border-white/20" asChild>
                  <Link href="/app/climate-advisory">
                    View Climate Advisory
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            ) : !currentWeather ? (
              <div className="text-center py-8">
                <CloudSun className="w-16 h-16 mx-auto text-white/40 mb-4" />
                <p className="text-white/60 text-sm mb-4">
                  {weatherLocation ? `Weather unavailable for ${weatherLocation}` : "Add location in profile"}
                </p>
                <Button variant="glass" className="w-full mt-4 text-white border-white/20" asChild>
                  <Link href="/app/climate-advisory">
                    View Climate Advisory
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  {weatherLocation && (
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <MapPin className="w-3 h-3 text-white/60" />
                      <p className="text-white/60 text-xs">{weatherLocation}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-3 mb-2">
                    {(() => {
                      const CurrentWeatherIcon = getWeatherIcon(currentWeather.weather[0]?.main || "Clouds");
                      return <CurrentWeatherIcon className="w-12 h-12 text-white" />;
                    })()}
                    <div>
                      <p className="text-4xl font-bold text-white">
                        {Math.round(currentWeather.main.temp - 273.15)}°C
                      </p>
                      <p className="text-white/80 text-sm capitalize">
                        {currentWeather.weather[0]?.description || "Clear"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <Droplets className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
                    <p className="text-white text-lg font-semibold">{currentWeather.main.humidity}%</p>
                    <p className="text-white/60 text-xs">Humidity</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <Wind className="w-5 h-5 mx-auto mb-1 text-white/80" />
                    <p className="text-white text-lg font-semibold">
                      {Math.round(currentWeather.wind.speed * 3.6)} km/h
                    </p>
                    <p className="text-white/60 text-xs">Wind</p>
                  </div>
                </div>

                {forecast && forecast.list && forecast.list.length > 0 && (
                  <div className="mb-6">
                    <p className="text-white/60 text-xs mb-2">5-Day Forecast</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar px-1 -mx-1">
                      {forecast.list.slice(0, 5).map((day: ForecastDay, i: number) => {
                        const WeatherIcon = getWeatherIcon(day.weather[0]?.main || "Clouds");
                        const date = new Date(day.dt * 1000);
                        return (
                          <div
                            key={day.dt}
                            className="flex-1 min-w-[60px] bg-white/10 rounded-xl p-2 text-center"
                          >
                            <p className="text-white/60 text-xs mb-1">
                              {i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" })}
                            </p>
                            <WeatherIcon className="w-6 h-6 mx-auto mb-1 text-white" />
                            <p className="text-white font-semibold text-sm">{Math.round(day.temp.max - 273.15)}°</p>
                            <p className="text-white/40 text-xs">{Math.round(day.temp.min - 273.15)}°</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Button variant="glass" className="w-full mt-4 text-white border-white/20" asChild>
                  <Link href="/app/climate-advisory">
                    View Full Forecast
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card variant="glass" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading activity...</p>
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent activity yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-hide">
                {recentActivities.map((activity) => {
                  const isTransaction = activity.kind === "transaction";
                  const isIncome = isTransaction && activity.type === "income";

                  const iconBg =
                    activity.kind === "notification"
                      ? "bg-amber-100 text-amber-700"
                      : isIncome
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-sky-100 text-sky-700";

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-2"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>
                          {activity.kind === "notification" ? (
                            <Bell className="w-4 h-4" />
                          ) : (
                            <ShoppingCart className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.title}</p>
                          {activity.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {activity.description}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {isTransaction && (
                        <div className="text-right text-xs font-semibold">
                          <span className={isIncome ? "text-emerald-600" : "text-sky-600"}>
                            {isIncome ? "+" : "-"}
                            PHP {Number(activity.amount).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
                <Link href="/app/marketplace">
                  <ShoppingBasket className="w-6 h-6" />
                  <span>Sell Item</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col py-6 gap-3"
                asChild
              >
                <Link href="/app/crop-doctor">
                  <Package className="w-6 h-6" />
                  <span>Diagnose Crop</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col py-6 gap-3"
                asChild
              >
                <Link href="/app/climate-advisory">
                  <CloudSun className="w-6 h-6" />
                  <span>Check Weather</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col py-6 gap-3"
                asChild
              >
                <Link href="/app/finances">
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

// Force dynamic rendering to prevent static generation
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};

