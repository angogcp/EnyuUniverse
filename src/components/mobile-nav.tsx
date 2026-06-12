"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Library, Sparkles, Compass, Landmark, MapPin, Target, Trophy,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: '创作馆', href: '/artworks',      icon: Library   },
  { name: '实验室', href: '/labs',           icon: Sparkles  },
  { name: '世界观', href: '/worldbuilding', icon: Compass   },
  { name: '足迹馆', href: '/travel',         icon: MapPin    },
  { name: '梦想',   href: '/dreams',         icon: Target    },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-book-border/70 bg-parchment/95 backdrop-blur-md"
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map(item => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-center transition-all ${
              isActive ? 'text-terracotta' : 'text-ink/40 hover:text-ink/70'
            }`}
          >
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              isActive ? 'bg-terracotta/10' : ''
            }`}>
              <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-terracotta' : ''}`} />
            </span>
            <span className={`text-[9px] font-bold tracking-wide ${
              isActive ? 'text-terracotta' : 'text-ink/40'
            }`}>
              {item.name}
            </span>
            {isActive && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-terracotta" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
