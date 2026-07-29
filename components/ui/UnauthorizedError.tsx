"use client";

import React from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function UnauthorizedError() {
  const router = useRouter();

  return (
    <div className="flex h-[calc(100vh-100px)] w-full flex-col items-center justify-center p-4">
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 before:absolute before:-inset-4 before:rounded-full before:bg-red-500/5">
        <ShieldAlert className="h-10 w-10 text-red-500" />
      </div>

      <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#ECECEA]">
        Access Denied
      </h1>
      
      <p className="mb-8 max-w-md text-center text-[15px] leading-relaxed text-[#8C8C8A]">
        You don't have permission to view this page. If you believe this is a
        mistake, please contact your administrator.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-lg border border-[#3A3A38] bg-[#1F1F1E] px-6 py-3 text-sm font-medium text-[#ECECEA] transition-all hover:bg-[#2C2C2A] hover:text-white"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
        <button
          onClick={() => router.push("/")}
          className="rounded-lg bg-indigo-500 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-indigo-600 shadow-lg shadow-indigo-500/20"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
