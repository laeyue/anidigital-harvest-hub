// Mock user data
export const mockUser = {
  id: "1",
  name: "Amara Okonkwo",
  email: "amara@farm.com",
  role: "Farmer",
  farmLocation: "Nairobi, Kenya",
  farmSize: "15 hectares",
  cropsPlanted: ["Maize", "Beans", "Tomatoes"],
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
  joinedDate: "2024-01-15",
};

// Mock products for marketplace
export const mockProducts = [
  {
    id: "1",
    name: "Fresh Organic Tomatoes",
    price: 45,
    unit: "kg",
    quantity: 500,
    category: "Vegetables",
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop",
    seller: "John's Farm",
    location: "Nakuru, Kenya",
    rating: 4.8,
  },
  {
    id: "2",
    name: "Sweet Yellow Maize",
    price: 35,
    unit: "kg",
    quantity: 1000,
    category: "Grains",
    image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop",
    seller: "Green Valley Farms",
    location: "Eldoret, Kenya",
    rating: 4.5,
  },
  {
    id: "3",
    name: "Fresh Avocados",
    price: 120,
    unit: "kg",
    quantity: 200,
    category: "Fruits",
    image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&h=300&fit=crop",
    seller: "Highland Orchards",
    location: "Limuru, Kenya",
    rating: 4.9,
  },
  {
    id: "4",
    name: "Organic Spinach Bundle",
    price: 25,
    unit: "bundle",
    quantity: 300,
    category: "Vegetables",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=300&fit=crop",
    seller: "Nature's Best",
    location: "Nairobi, Kenya",
    rating: 4.7,
  },
  {
    id: "5",
    name: "Red Kidney Beans",
    price: 180,
    unit: "kg",
    quantity: 800,
    category: "Grains",
    image: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&h=300&fit=crop",
    seller: "Bean Masters",
    location: "Kisumu, Kenya",
    rating: 4.6,
  },
  {
    id: "6",
    name: "Fresh Mangoes",
    price: 80,
    unit: "kg",
    quantity: 450,
    category: "Fruits",
    image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&h=300&fit=crop",
    seller: "Tropical Fruits Co",
    location: "Mombasa, Kenya",
    rating: 4.8,
  },
];

// Mock weather data
export const mockWeather = {
  current: {
    temp: 24,
    condition: "Partly Cloudy",
    humidity: 65,
    windSpeed: 12,
    icon: "cloud-sun",
  },
  forecast: [
    { day: "Mon", high: 26, low: 18, icon: "sun", condition: "Sunny" },
    { day: "Tue", high: 25, low: 17, icon: "cloud-sun", condition: "Partly Cloudy" },
    { day: "Wed", high: 23, low: 16, icon: "cloud-rain", condition: "Light Rain" },
    { day: "Thu", high: 22, low: 15, icon: "cloud-rain", condition: "Rainy" },
    { day: "Fri", high: 24, low: 17, icon: "cloud", condition: "Cloudy" },
    { day: "Sat", high: 27, low: 19, icon: "sun", condition: "Sunny" },
    { day: "Sun", high: 28, low: 20, icon: "sun", condition: "Sunny" },
  ],
  advisories: [
    {
      id: "1",
      type: "warning",
      title: "Heavy Rain Expected",
      message: "Delay fertilizer application. Expected rainfall of 30mm on Wednesday-Thursday.",
      icon: "cloud-rain",
    },
    {
      id: "2",
      type: "info",
      title: "Optimal Planting Window",
      message: "Saturday-Sunday will have ideal conditions for planting. Soil moisture levels will be perfect.",
      icon: "sprout",
    },
    {
      id: "3",
      type: "success",
      title: "Harvest Conditions",
      message: "Current dry spell is ideal for harvesting maize. Complete harvest before Wednesday.",
      icon: "wheat",
    },
  ],
};

// Mock financial data
export const mockFinances = {
  totalIncome: 450000,
  totalExpenses: 180000,
  netProfit: 270000,
  monthlyData: [
    { month: "Jan", income: 35000, expenses: 15000 },
    { month: "Feb", income: 42000, expenses: 18000 },
    { month: "Mar", income: 38000, expenses: 14000 },
    { month: "Apr", income: 55000, expenses: 22000 },
    { month: "May", income: 48000, expenses: 16000 },
    { month: "Jun", income: 62000, expenses: 20000 },
    { month: "Jul", income: 58000, expenses: 25000 },
    { month: "Aug", income: 52000, expenses: 18000 },
    { month: "Sep", income: 60000, expenses: 32000 },
  ],
  transactions: [
    { id: "1", date: "2024-09-15", description: "Sold 200kg Tomatoes", amount: 9000, type: "income" },
    { id: "2", date: "2024-09-14", description: "Fertilizer Purchase", amount: -4500, type: "expense" },
    { id: "3", date: "2024-09-13", description: "Sold 150kg Maize", amount: 5250, type: "income" },
    { id: "4", date: "2024-09-12", description: "Seeds Purchase", amount: -2000, type: "expense" },
    { id: "5", date: "2024-09-11", description: "Sold 100kg Beans", amount: 18000, type: "income" },
    { id: "6", date: "2024-09-10", description: "Labor Payment", amount: -8000, type: "expense" },
    { id: "7", date: "2024-09-09", description: "Equipment Repair", amount: -3500, type: "expense" },
    { id: "8", date: "2024-09-08", description: "Sold 80kg Avocados", amount: 9600, type: "income" },
  ],
};

// Mock dashboard stats
export const mockDashboardStats = {
  totalSales: 450000,
  activeListings: 12,
  pendingOrders: 5,
  totalBuyers: 48,
  recentActivity: [
    { id: "1", type: "sale", message: "Sold 50kg of Tomatoes to James Mwangi", time: "2 hours ago" },
    { id: "2", type: "listing", message: "New listing: Fresh Organic Spinach", time: "5 hours ago" },
    { id: "3", type: "alert", message: "Weather alert: Rain expected tomorrow", time: "8 hours ago" },
    { id: "4", type: "order", message: "New order received from Mary Wanjiku", time: "1 day ago" },
    { id: "5", type: "payment", message: "Payment received: KES 12,500", time: "1 day ago" },
  ],
};

// Mock crop diagnosis results
export const mockDiagnosis = {
  disease: "Early Blight",
  confidence: 94.5,
  severity: "Moderate",
  affectedArea: "Leaves",
  treatments: [
    "Apply copper-based fungicide (2-3 times at 7-day intervals)",
    "Remove and destroy affected leaves immediately",
    "Improve air circulation by proper plant spacing",
    "Avoid overhead irrigation; use drip irrigation instead",
    "Apply mulch to prevent soil splash onto leaves",
  ],
  prevention: [
    "Rotate crops every 2-3 years",
    "Use disease-resistant varieties",
    "Maintain proper plant nutrition",
    "Monitor humidity levels in greenhouse",
  ],
};

// Categories for marketplace
export const categories = [
  { value: "all", label: "All Categories" },
  { value: "vegetables", label: "Vegetables" },
  { value: "fruits", label: "Fruits" },
  { value: "grains", label: "Grains" },
  { value: "dairy", label: "Dairy" },
  { value: "livestock", label: "Livestock" },
];
