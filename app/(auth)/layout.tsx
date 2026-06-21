import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#1C1C1B] flex items-center justify-center p-4">
      {children}
    </div>
  );
}
