"use client";

import { ArrowDownUp, Search, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type SortKey = "newest" | "oldest" | "title" | "year";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A–Z" },
  { value: "year", label: "Year made" },
];

interface FilterBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: { name: string; count: number }[];
  total: number;
  featuredOnly: boolean;
  onFeaturedOnlyChange: (value: boolean) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
}

export function FilterBar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  categories,
  total,
  featuredOnly,
  onFeaturedOnlyChange,
  sort,
  onSortChange,
}: FilterBarProps) {
  const pills = [{ name: "All", count: total }, ...categories];

  return (
    <div className="sticky top-16 z-30 -mx-4 px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="glass mx-auto flex max-w-7xl flex-col gap-3 rounded-3xl px-3 py-3 shadow-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="gallery-search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search titles, media, descriptions…"
              aria-label="Search artworks"
              className="h-11 rounded-full border-transparent bg-white/70 pr-10 pl-10 shadow-none focus-visible:bg-white"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="gallery-featured-only"
              className="flex h-11 cursor-pointer items-center gap-2.5 rounded-full bg-white/70 px-4 text-sm font-medium"
            >
              <Sparkles
                className={cn(
                  "size-4 transition-colors",
                  featuredOnly ? "text-primary" : "text-muted-foreground",
                )}
              />
              Featured
              <Switch
                id="gallery-featured-only"
                checked={featuredOnly}
                onCheckedChange={onFeaturedOnlyChange}
              />
            </label>

            <Select
              value={sort}
              onValueChange={(v) => v && onSortChange(v as SortKey)}
              items={SORT_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
            >
              <SelectTrigger
                aria-label="Sort artworks"
                className="h-11 rounded-full border-transparent bg-white/70 px-4 shadow-none"
              >
                <ArrowDownUp className="size-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
          {pills.map((pill) => {
            const active = category === pill.name;
            return (
              <button
                key={pill.name}
                type="button"
                onClick={() => onCategoryChange(pill.name)}
                aria-pressed={active}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                  active
                    ? "border-transparent bg-foreground text-white shadow-soft"
                    : "border-transparent bg-white/70 text-foreground/75 hover:bg-white hover:text-foreground",
                )}
              >
                {pill.name}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px] tabular-nums",
                    active ? "bg-white/20" : "bg-muted text-muted-foreground",
                  )}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
