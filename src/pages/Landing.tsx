"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ShoppingBasket,
  Stethoscope,
  CloudSun,
  Wallet,
  ArrowRight,
  Check,
  TrendingUp,
  Leaf,
  MapPin,
  Star,
} from "lucide-react";

const features = [
  {
    icon: ShoppingBasket,
    title: "Digital Marketplace",
    description: "Connect directly with buyers and sellers. List your produce, negotiate prices, and grow your network.",
    color: "from-primary to-emerald",
  },
  {
    icon: Stethoscope,
    title: "AI Crop Doctor",
    description: "Upload photos of your crops and get instant AI-powered diagnosis for diseases and pest infestations.",
    color: "from-accent to-sunset",
  },
  {
    icon: CloudSun,
    title: "Climate Advisory",
    description: "Get hyperlocal weather forecasts and farming recommendations tailored to your location.",
    color: "from-blue-500 to-cyan-400",
  },
  {
    icon: Wallet,
    title: "Financial Tracking",
    description: "Track your income, expenses, and profits. Get insights to make smarter farming decisions.",
    color: "from-purple-500 to-pink-400",
  },
];

// Stats component removed as it's not being used

const testimonials = [
  {
    name: "Juan Dela Cruz",
    role: "Rice Farmer, Nueva Ecija",
    content: "Ani-Digital helped me increase my sales by 40%. The marketplace connects me directly with buyers.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "Maria Santos",
    role: "Vegetable Farmer, Benguet",
    content: "The Crop Doctor feature saved my entire tomato harvest. It detected blight early and gave me treatment options.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "Carlos Reyes",
    role: "Coconut Farmer, Quezon",
    content: "Weather alerts helped me plan my activities better. I no longer lose crops to unexpected weather.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  },
];

const Landing = () => {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-[hsl(152,60%,18%)] bg-gradient-hero bg-hero-pattern">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-emerald/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white/90 text-sm mb-6 border border-white/20">
                <Leaf className="w-4 h-4 text-emerald" />
                <span>Empowering 15,000+ farmers across Philippines</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Grow Smarter with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-light to-white">
                  Digital Farming
                </span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto lg:mx-0">
                Connect to markets, diagnose crop diseases instantly, get weather insights, 
                and manage your farm finances — all in one powerful platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="xl" variant="accent" asChild>
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button size="xl" variant="glass" className="text-white border-white/30" asChild>
                  <Link href="/login">Log In</Link>
                </Button>
              </div>

              <div className="flex items-center gap-6 mt-10 justify-center lg:justify-start">
                <div className="flex -space-x-3">
                  {testimonials.map((t, i) => (
                    <img
                      key={i}
                      src={t.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full border-2 border-white/30"
                    />
                  ))}
                </div>
                <div className="text-white/80 text-sm">
                  <span className="text-white font-semibold">4.9/5</span> from 2,000+ reviews
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block animate-slide-up delay-200">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=500&fit=crop"
                  alt="Farmer in field"
                  className="rounded-3xl shadow-2xl"
                />
                {/* Floating Cards */}
                <Card variant="glass" className="absolute -left-10 top-10 p-4 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">This Month</p>
                      <p className="font-bold text-lg">+45% Sales</p>
                    </div>
                  </div>
                </Card>
                <Card variant="glass" className="absolute -right-5 bottom-20 p-4 animate-float delay-1000">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-sunset flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Crop Diagnosis</p>
                      <p className="font-bold text-lg text-primary">Healthy!</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="text-primary">Thrive</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful tools designed specifically for modern farmers. 
              From selling your produce to protecting your crops.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <Card
                key={i}
                variant="glass"
                className="group hover-lift p-8 animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                About <span className="text-primary">Ani-Digital</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Empowering Filipino farmers with digital tools for sustainable agriculture
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <Card variant="glass" className="p-6">
                <h3 className="text-xl font-bold mb-4">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To bridge the gap between traditional farming and modern technology, 
                  providing Filipino farmers with accessible tools that increase productivity, 
                  improve crop health, and connect them directly to markets.
                </p>
              </Card>
              <Card variant="glass" className="p-6">
                <h3 className="text-xl font-bold mb-4">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  A future where every farmer in the Philippines has access to digital 
                  farming solutions, enabling sustainable agriculture and economic growth 
                  in rural communities across the nation.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-24 bg-gradient-to-br from-primary/5 via-background to-emerald/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Real Impact, Real{" "}
              <span className="text-primary">Stories</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Hear from farmers who transformed their businesses with Ani-Digital.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <Card
                key={i}
                variant="glass"
                className="p-6 animate-slide-up hover-lift"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">&quot;{testimonial.content}&quot;</p>
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[hsl(152,60%,18%)] bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-50" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Farm?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Join thousands of farmers already growing smarter with Ani-Digital. 
              Sign up today — it&apos;s free to start!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="accent" asChild>
                <Link href="/signup">
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="xl" variant="glass" className="text-white border-white/30" asChild>
                <Link href="/#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
