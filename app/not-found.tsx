"use client";

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#1C1C1B]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[var(--theme-color)] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-[#ECECEA] mb-2">Page Not Found</h2>
        <p className="text-[#8C8C8A] mb-8">The page you're looking for doesn't exist or you don't have access.</p>
        <Link 
          href="/" 
          className="bg-[var(--theme-color)] text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
