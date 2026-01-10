"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Leaf, Menu, X } from "lucide-react";
import { useState } from "react";

const PublicNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleHashLink = (hash: string, e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(false);
    
    if (pathname !== '/') {
      router.push('/');
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-xl transition-shadow">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Ani<span className="text-primary">-Digital</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a 
              href="/#features" 
              onClick={(e) => handleHashLink('#features', e)}
              className="text-muted-foreground hover:text-primary transition-colors font-medium cursor-pointer"
            >
              Features
            </a>
            <a 
              href="/#impact" 
              onClick={(e) => handleHashLink('#impact', e)}
              className="text-muted-foreground hover:text-primary transition-colors font-medium cursor-pointer"
            >
              Impact
            </a>
            <a 
              href="/#about" 
              onClick={(e) => handleHashLink('#about', e)}
              className="text-muted-foreground hover:text-primary transition-colors font-medium cursor-pointer"
            >
              About
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              <a
                href="/#features"
                onClick={(e) => handleHashLink('#features', e)}
                className="text-muted-foreground hover:text-primary transition-colors font-medium px-2 py-2 cursor-pointer"
              >
                Features
              </a>
              <a
                href="/#impact"
                onClick={(e) => handleHashLink('#impact', e)}
                className="text-muted-foreground hover:text-primary transition-colors font-medium px-2 py-2 cursor-pointer"
              >
                Impact
              </a>
              <a
                href="/#about"
                onClick={(e) => handleHashLink('#about', e)}
                className="text-muted-foreground hover:text-primary transition-colors font-medium px-2 py-2 cursor-pointer"
              >
                About
              </a>
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/login">Log In</Link>
                </Button>
                <Button variant="hero" className="flex-1" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default PublicNavbar;
