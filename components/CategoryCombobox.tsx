"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Category } from "@/types/expense";

interface CategoryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export function CategoryCombobox({ value, onChange, onBlur }: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const categories = useLiveQuery(() => db.table("categories").toArray()) ?? [];

  const handleSelect = (currentValue: string) => {
    onChange(currentValue);
    setOpen(false);
  };

  const addNewCategory = async (name: string) => {
    try {
      await db.table("categories").add({ name, maxAmount: 0 });
      handleSelect(name);
    } catch (e) {
      console.error("Failed to add category", e);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between rounded-xl border-zinc-200 font-normal hover:bg-zinc-50"
          onBlur={onBlur}
        >
          {value || <span className="text-zinc-400">Select category...</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl overflow-hidden" align="start">
        <Command>
          <CommandInput 
            placeholder="Search category..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty className="py-2 px-4 text-xs">
              <button
                type="button"
                onClick={() => addNewCategory(search)}
                className="flex items-center gap-2 text-green-600 font-semibold hover:underline"
              >
                <Plus size={12} /> Add "{search}"
              </button>
            </CommandEmpty>
            <CommandGroup>
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.name}
                  onSelect={handleSelect}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {category.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
