"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";

interface TablePaginationProps {
  /** 1-indexed current page */
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

/** Smart page number list with ellipsis — always max 7 items wide. */
function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "ellipsis", total];
  if (current >= total - 3)
    return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

export function TablePagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [12, 24, 48],
  className,
}: TablePaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const rangeStart = totalElements === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalElements);
  const pages = getPageNumbers(currentPage, safeTotalPages);

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 py-3",
        className,
      )}
    >
      {/* ── Left: count + rows per page ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-zinc-500 tabular-nums whitespace-nowrap">
          {totalElements > 0
            ? `${rangeStart}–${rangeEnd} of ${totalElements}`
            : "No results"}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-400 whitespace-nowrap hidden md:inline">
              Per page
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                onPageSizeChange(Number(v));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="h-7 w-[70px] text-xs border-zinc-200 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)} className="text-xs">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* ── Right: page controls ── */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 font-bold text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>

        {/* Numbered buttons — hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, i) =>
            p === "ellipsis" ? (
              <span
                key={`ellipsis-${i}`}
                className="flex h-8 w-8 items-center justify-center text-xs text-zinc-400 select-none"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                aria-label={`Go to page ${p}`}
                aria-current={p === currentPage ? "page" : undefined}
                className={cn(
                  "h-8 w-8 rounded-md text-xs font-medium transition-colors",
                  p === currentPage
                    ? "bg-primary text-primary-foreground cursor-default"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                )}
              >
                {p}
              </button>
            ),
          )}
        </div>

        {/* Compact label for xs screens only */}
        <span className="sm:hidden text-xs text-zinc-500 px-2 whitespace-nowrap">
          {currentPage} / {safeTotalPages}
        </span>

        {/* Next */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 font-bold text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30"
          disabled={currentPage >= safeTotalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
