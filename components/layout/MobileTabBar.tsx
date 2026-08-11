"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItem } from '@/lib/types';

interface MobileTabBarProps {
  navItems: NavItem[];
}

export function MobileTabBar({ navItems }: MobileTabBarProps) {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[calc(4rem+var(--safe-bottom))] pb-[var(--safe-bottom)] bg-[#1F1F1E] border-t border-[#2E2E2C] flex items-center justify-around px-4 z-40">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/');
        
        return (
          <Link key={item.href} href={item.href}>
            <div className="min-w-12 h-12 flex items-center justify-center cursor-pointer">
              <Icon size={20} className={isActive ? "text-[#ECECEA]" : "text-[#5A5A58]"} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
