'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, BarChart3, AlertTriangle, TrendingUp, Settings } from 'lucide-react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: 'Dashboard', href: '/', icon: BarChart3 },
    { label: 'Flagged Stocks', href: '/stocks', icon: AlertTriangle },
    { label: 'Trends', href: '/trends', icon: TrendingUp },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 hover:bg-secondary rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 bg-secondary border-r border-border">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="text-primary" size={24} />
            <span className="text-balance">Insider Trading Detector</span>
          </h1>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-card transition-colors"
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-6 border-t border-border text-xs text-muted">
          <p>© 2024 Pattern Detector</p>
          <p>v1.0.0</p>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40">
          <aside className="flex flex-col fixed left-0 top-0 h-screen w-60 bg-secondary border-r border-border z-50">
            <div className="p-6 border-b border-border mt-16">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="text-primary" size={24} />
                <span>Insider Detector</span>
              </h1>
            </div>
            <nav className="flex-1 p-6 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-card transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
