"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { EmptyState } from "./EmptyState";

export type ColumnDef = {
  label: string;
  width: string;
  align?: "left" | "right";
};

interface TableShellProps {
  columns: ColumnDef[];
  isLoading: boolean;
  isEmpty: boolean;
  emptyIcon: LucideIcon;
  emptyHeading: string;
  emptySubtext?: string;
  minWidth?: string;
  children: React.ReactNode;
}

export function TableShell({
  columns,
  isLoading,
  isEmpty,
  emptyIcon,
  emptyHeading,
  emptySubtext,
  minWidth = "900px",
  children,
}: TableShellProps) {
  return (
    <div className="border border-[#3A3A38] rounded-lg overflow-x-auto bg-[#1F1F1E]">
      <div style={{ minWidth }}>
        {/* Column headers */}
        <div className="flex items-center px-4 py-2.5 bg-[#1F1F1E] text-[11px] text-[#5A5A58] uppercase tracking-wider">
          {columns.map((col, i) => (
            <div
              key={i}
              style={{ width: col.width !== 'flex-1' ? col.width : undefined }}
              className={`${col.width === 'flex-1' ? 'flex-1 ' : ''}${col.align === "right" ? "text-right" : ""}`}
            >
              {col.label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex flex-col">
          {isLoading ? (
            <div className="py-8 text-center text-[#5A5A58] text-[13px]">
              Loading...
            </div>
          ) : isEmpty ? (
            <div className="py-8">
              <EmptyState
                icon={emptyIcon}
                heading={emptyHeading}
                subtext={emptySubtext}
              />
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
