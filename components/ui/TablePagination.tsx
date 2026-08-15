"use client";

import React from "react";

interface TablePaginationProps {
  page: number;
  total: number;
  rowsPerPage: string;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (value: string) => void;
}

export function TablePagination({
  page,
  total,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: TablePaginationProps) {
  const totalPages = Math.ceil(total / parseInt(rowsPerPage, 10)) || 1;
  const from = total === 0 ? 0 : Math.min((page - 1) * parseInt(rowsPerPage) + 1, total);
  const to = Math.min(page * parseInt(rowsPerPage), total);

  return (
    <div className="flex flex-col gap-2 px-3 sm:px-4 py-3 border-t border-[#2E2E2C] bg-[#1F1F1E]">
      {/* Top row - Results info (mobile) */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 sm:hidden">
        <span className="text-[11px] text-[#8C8C8A]">
          Showing {from}–{to} of {total}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#8C8C8A]">Rows:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(e.target.value)}
            className="bg-[#2C2C2A] border border-[#3A3A38] rounded text-[11px] text-[#ECECEA] px-1.5 py-0.5 focus:outline-none"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="70">70</option>
          </select>
        </div>
      </div>

      {/* Desktop row */}
      <div className="hidden sm:flex sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <span className="text-[11px] sm:text-[12px] text-[#8C8C8A] whitespace-nowrap">
            Showing {from} to {to} of {total} results
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] sm:text-[12px] text-[#8C8C8A]">Rows:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => onRowsPerPageChange(e.target.value)}
              className="bg-[#2C2C2A] border border-[#3A3A38] rounded text-[11px] sm:text-[12px] text-[#ECECEA] px-1.5 py-0.5 focus:outline-none"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="70">70</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-2.5 py-1 text-[11px] sm:text-[12px] text-[#5A5A58] border border-[#2E2E2C] rounded hover:bg-[#2C2C2A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          <button className="px-2.5 py-1 text-[11px] sm:text-[12px] text-[#ECECEA] bg-[#2C2C2A] border border-[#4A4A48] rounded min-w-[28px] text-center">
            {page}
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-2.5 py-1 text-[11px] sm:text-[12px] text-[#5A5A58] border border-[#2E2E2C] rounded hover:bg-[#2C2C2A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Bottom row - Pagination buttons (mobile) */}
      <div className="flex items-center justify-center gap-1 sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1 text-[11px] text-[#5A5A58] border border-[#2E2E2C] rounded hover:bg-[#2C2C2A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-1 max-w-[80px] text-center"
        >
          Prev
        </button>
        <button className="px-3 py-1 text-[11px] text-[#ECECEA] bg-[#2C2C2A] border border-[#4A4A48] rounded min-w-[32px] text-center">
          {page}
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="px-3 py-1 text-[11px] text-[#5A5A58] border border-[#2E2E2C] rounded hover:bg-[#2C2C2A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-1 max-w-[80px] text-center"
        >
          Next
        </button>
      </div>
    </div>
  );
}