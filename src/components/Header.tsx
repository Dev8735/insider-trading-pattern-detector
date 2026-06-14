'use client';

import { Bell, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 md:left-60 h-16 bg-card border-b border-border flex items-center justify-between px-6 z-40">
      <div className="hidden md:block">
        <h2 className="text-sm font-semibold text-muted">Dashboard</h2>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <Bell size={20} className="text-muted" />
        </button>
        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <User size={20} className="text-muted" />
        </button>
      </div>
    </header>
  );
}
