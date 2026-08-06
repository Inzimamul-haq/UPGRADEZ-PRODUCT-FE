"use client";

import { Palette } from "lucide-react";

export default function ThemesPage() {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Palette className="h-6 w-6" />
          Theme Management
        </h1>
        <p className="text-text-muted text-sm">
          Customize the platform appearance, branding, and color schemes.
        </p>
      </div>

      {/* Placeholder Card */}
      <div className="bg-panel border border-border-default rounded-lg min-h-[500px] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#2C2C2A] border border-border-default">
            <Palette className="h-8 w-8 text-text-muted" />
          </div>

          <h2 className="mt-6 text-xl font-semibold text-text-primary">
            Theme Management
          </h2>

          <div className="mt-6 inline-flex items-center rounded-md border border-border-default bg-[#2C2C2A] px-3 py-1.5 text-xs font-medium text-text-muted">
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}