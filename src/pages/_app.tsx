"use client";

import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Providers } from "@/components/Providers";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import "@/index.css";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const isAppRoute = router.pathname?.startsWith('/app');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if accessing app routes without auth (client-side check)
  useEffect(() => {
    if (mounted && isAppRoute && !loading && !user) {
      router.push('/login');
    }
  }, [mounted, isAppRoute, loading, user, router]);

  // Show loading state during initial mount or auth check
  if (!mounted || (isAppRoute && loading)) {
    return (
      <Providers>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Providers>
    );
  }

  // If app route and not authenticated, don't render (will redirect)
  if (isAppRoute && !user) {
    return (
      <Providers>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Providers>
    );
  }

  const content = <Component {...pageProps} />;

  return (
    <Providers>
      {isAppRoute ? <AppLayout>{content}</AppLayout> : content}
    </Providers>
  );
}

