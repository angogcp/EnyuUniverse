"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { db, User } from '@/lib/db';
import { Sparkles, Library, Compass, Target, Shield, Users, Landmark, MapPin } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    // Load users and current active user
    setUsers(db.getUsers());
    setActiveUser(db.getActiveUser());

    // Listener to update active user if changed elsewhere
    const handleStorageChange = () => {
      setActiveUser(db.getActiveUser());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleRoleChange = (userId: string) => {
    db.setActiveUser(userId);
    setActiveUser(db.getActiveUser());
    setShowRoleMenu(false);
    
    // Redirect or refresh page to update server/client states
    router.refresh();
    // Go to homepage to see new greetings
    router.push('/');
  };

  const navItems = [
    { name: '创作馆', href: '/artworks', icon: Library },
    { name: '实验室', href: '/labs', icon: Sparkles },
    { name: '世界观', href: '/worldbuilding', icon: Compass },
    { name: '成长年轮', href: '/timeline', icon: Landmark },
    { name: '足迹馆', href: '/travel', icon: MapPin },
    { name: '梦想档案', href: '/dreams', icon: Target },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-book-border/60 bg-parchment/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-terracotta text-parchment shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold tracking-tight text-ink">Project J</span>
            <span className="font-serif text-[10px] italic text-ink/60 -mt-1">Digital Growth Garden</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all-custom ${
                  isActive
                    ? 'bg-paper text-terracotta border border-book-border'
                    : 'text-ink/70 hover:bg-paper/50 hover:text-ink hover:border-transparent border border-transparent'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-terracotta' : 'text-ink/50'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Role Switcher Dropdown */}
        <div className="relative">
          {activeUser && (
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 rounded-full border border-book-border bg-paper/60 px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition-all hover:bg-paper hover:border-ink/20"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sage/10 text-sage font-bold">
                {activeUser.role.charAt(0)}
              </div>
              <span className="max-w-[80px] truncate">{activeUser.name}</span>
              <span className="rounded bg-terracotta/10 px-1.5 py-0.5 text-[9px] font-bold text-terracotta uppercase">
                {activeUser.role}
              </span>
            </button>
          )}

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-book-border bg-parchment p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-ink/40">
                切换视图角色 (模拟测试)
              </div>
              <div className="space-y-1">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleRoleChange(u.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-paper ${
                      activeUser?.id === u.id
                        ? 'bg-paper font-semibold text-terracotta'
                        : 'text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={u.avatar_url}
                        alt={u.name}
                        className="h-6 w-6 rounded-full bg-paper/80 p-0.5 border border-book-border"
                      />
                      <div>
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-[10px] text-ink/50">{u.email}</div>
                      </div>
                    </div>
                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${
                      u.role === 'Father' ? 'bg-terracotta/10 text-terracotta' :
                      u.role === 'Child' ? 'bg-sage/10 text-sage' : 'bg-gold/10 text-gold'
                    }`}>
                      {u.role}
                    </span>
                  </button>
                ))}

                {/* Simulate Guest role */}
                <button
                  onClick={() => {
                    const guestUser: User = {
                      id: 'user-guest',
                      name: '访客 (Guest)',
                      email: 'guest@example.com',
                      role: 'Guest',
                      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
                      created_at: new Date().toISOString(),
                    };
                    // Temporarily add or mock guest
                    if (users.findIndex(u => u.id === 'user-guest') === -1) {
                      setUsers([...users, guestUser]);
                    }
                    localStorage.setItem('project_j_active_role_id', 'user-guest');
                    setActiveUser(guestUser);
                    setShowRoleMenu(false);
                    router.refresh();
                    router.push('/');
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-paper ${
                    activeUser?.role === 'Guest'
                      ? 'bg-paper font-semibold text-gold'
                      : 'text-ink/70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-paper border border-book-border text-ink/40">
                      <Shield className="h-3 w-3" />
                    </div>
                    <div>
                      <div className="font-semibold">访客模式</div>
                      <div className="text-[10px] text-ink/50">只读公开作品</div>
                    </div>
                  </div>
                  <span className="rounded bg-gold/10 px-1.5 py-0.5 text-[8px] font-bold text-gold">
                    GUEST
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
