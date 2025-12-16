import { Link } from "react-router-dom";
import { Leaf, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-forest text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                <Leaf className="w-5 h-5 text-emerald" />
              </div>
              <span className="text-xl font-bold">
                Ani<span className="text-emerald">-Digital</span>
              </span>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed">
              Empowering farmers with digital tools to grow smarter, sell better, and thrive sustainably.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-white/70 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/#features" className="text-white/70 hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/#impact" className="text-white/70 hover:text-white transition-colors">Impact</Link></li>
              <li><Link to="/login" className="text-white/70 hover:text-white transition-colors">Login</Link></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Features</h4>
            <ul className="space-y-3">
              <li><span className="text-white/70">Marketplace</span></li>
              <li><span className="text-white/70">Crop Doctor</span></li>
              <li><span className="text-white/70">Climate Advisory</span></li>
              <li><span className="text-white/70">Financial Tracking</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Contact</h4>
            <ul className="space-y-3">
              <li className="text-white/70">support@ani-digital.com</li>
              <li className="text-white/70">+63 900 123 4567</li>
              <li className="text-white/70">Manila, Philippines</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-sm">
            © 2024 Ani-Digital. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="#" className="text-white/50 hover:text-white text-sm transition-colors">Privacy Policy</Link>
            <Link to="#" className="text-white/50 hover:text-white text-sm transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
