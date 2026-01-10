import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Providers } from "@/components/Providers";
import AppLayout from "@/components/layout/AppLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import { useAuth } from "@/contexts/AuthContext";
import "@/index.css";

// Inner component that uses auth - must be within Providers
function AppContent({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();
  
  // Must call useRouter() at top level unconditionally - required by React hooks rules
  // In Pages Router, this should work even during SSR
  const router = useRouter();
  
  const isAppRoute = router.pathname?.startsWith('/app') ?? false;
  const isPublicRoute = !isAppRoute && router.pathname !== '/login' && router.pathname !== '/signup';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if accessing app routes without auth (client-side check)
  useEffect(() => {
    if (mounted && router.isReady && isAppRoute && !loading && !user) {
      router.push('/login');
    }
  }, [mounted, router, isAppRoute, loading, user]);

  // Show loading state during initial mount or auth check
  if (!mounted || (isAppRoute && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // If app route and not authenticated, don't render (will redirect)
  if (isAppRoute && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const content = <Component {...pageProps} />;

  // Wrap app routes with AppLayout, public routes with PublicLayout, auth pages with no layout
  if (isAppRoute) {
    return <AppLayout>{content}</AppLayout>;
  }
  
  if (isPublicRoute) {
    return <PublicLayout>{content}</PublicLayout>;
  }
  
  return content;
}

export default function App(props: AppProps) {
  return (
    <Providers>
      <AppContent {...props} />
    </Providers>
  );
}

