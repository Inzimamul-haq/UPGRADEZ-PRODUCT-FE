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
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#2E2E2C] bg-[#1F1F1E]">
      <div className="flex items-center gap-4">
        <span className="text-[12px] text-[#8C8C8A]">
          Showing {from} to {to} of {total} results
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#8C8C8A]">Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(e.target.value)}
            className="bg-[#2C2C2A] border border-[#3A3A38] rounded text-[12px] text-[#ECECEA] px-1 py-0.5 focus:outline-none"
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
          className="px-2 py-1 text-[12px] text-[#5A5A58] border border-[#2E2E2C] rounded disabled:cursor-not-allowed hover:bg-[#2C2C2A]"
        >
          Previous
        </button>
        <button className="px-2 py-1 text-[12px] text-[#ECECEA] bg-[#2C2C2A] border border-[#4A4A48] rounded">
          {page}
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="px-2 py-1 text-[12px] text-[#5A5A58] border border-[#2E2E2C] rounded disabled:cursor-not-allowed hover:bg-[#2C2C2A]"
        >
          Next
        </button>
      </div>
    </div>
  );
}
