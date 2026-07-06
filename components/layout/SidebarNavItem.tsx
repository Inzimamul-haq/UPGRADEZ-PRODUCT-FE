"use client";

import { SidebarNavItemProps } from '@/lib/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';


export function SidebarNavItem({ href, icon: Icon, label }: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href) && (href !== '/' || pathname === '/');

  return (
    <Link href={href}>
      <div
        className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors duration-150 ${
          isActive
            ? "bg-[#2C2C2A] border-l-2 border-l-[#ECECEA] text-[#ECECEA]"
            : "text-[#8C8C8A] hover:bg-[#333331] hover:text-[#ECECEA]"
        }`}
      >
        <Icon size={16} />
        <span className="text-[13px]">{label}</span>
      </div>
    </Link>
  );
}
