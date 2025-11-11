import { Button } from "@/components/ui/button";
import { Menu, X, Heart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { APP_DOMAIN } from "@/config/domains";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Individuals", href: "/individuals" },
    { name: "Facilities", href: "/facilities" },
    { name: "FAQs", href: "/faqs" },
    { name: "Contact", href: "/contact" },
  ];

  const footerCompanyLinks = [
    { name: "Vision", href: "/vision" },
    { name: "Careers", href: "/careers" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer group">
                <Heart 
                  className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 fill-blue-600 transition-all group-hover:scale-110" 
                />
                <span className="text-xl sm:text-2xl font-bold text-gray-900 transition-all group-hover:text-blue-600">
                  Elder Voice
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <span
                    className={`text-sm font-medium transition-colors cursor-pointer hover:scale-105 ${
                      location === item.href
                        ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                        : "text-gray-700 hover:text-blue-600"
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
              <a href={`${APP_DOMAIN}/auth/signin`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="transition-all hover:scale-105"
                >
                  Sign In
                </Button>
              </a>
              <a href={`${APP_DOMAIN}/getstarted`}>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-105 shadow-md"
                  size="sm"
                >
                  Get Started
                </Button>
              </a>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <nav className="flex flex-col space-y-4">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <span
                      className={`block text-base font-medium cursor-pointer ${
                        location === item.href
                          ? "text-blue-600"
                          : "text-gray-700"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </span>
                  </Link>
                ))}
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  <a href={`${APP_DOMAIN}/auth/signin`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Button>
                  </a>
                  <a href={`${APP_DOMAIN}/getstarted`}>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 w-full"
                      size="sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </Button>
                  </a>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Heart 
                  className="h-6 w-6 text-blue-500 fill-blue-500" 
                />
                <span className="text-lg font-bold text-white">
                  Elder Voice
                </span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed max-w-md">
                Providing compassionate AI-powered companionship for seniors
                through regular, caring phone calls that reduce isolation and
                bring peace of mind to families.
              </p>
              <div className="mt-4">
                <p className="text-gray-400 text-xs">
                  © 2025 Inverse Collective LLC. All rights reserved.
                </p>
                <div className="flex gap-4 mt-2">
                  <Link href="/privacy-policy">
                    <span className="text-gray-400 hover:text-gray-200 text-xs cursor-pointer transition-colors">
                      Privacy Policy
                    </span>
                  </Link>
                  <Link href="/terms-of-service">
                    <span className="text-gray-400 hover:text-gray-200 text-xs cursor-pointer transition-colors">
                      Terms of Service
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2">
                {navigation.slice(0, 3).map((item) => (
                  <li key={item.name}>
                    <Link href={item.href}>
                      <span className="text-gray-300 hover:text-white text-sm cursor-pointer transition-colors">
                        {item.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                {navigation.slice(3).map((item) => (
                  <li key={item.name}>
                    <Link href={item.href}>
                      <span className="text-gray-300 hover:text-white text-sm cursor-pointer transition-colors">
                        {item.name}
                      </span>
                    </Link>
                  </li>
                ))}
                {footerCompanyLinks.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href}>
                      <span className="text-gray-300 hover:text-white text-sm cursor-pointer transition-colors">
                        {item.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}
