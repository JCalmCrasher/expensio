"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Settings, Plus, Trash2, X, AlertCircle } from "lucide-react";
import { db } from "@/lib/db";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/lib/useCurrency";
import { toast } from "sonner";
import type { Category } from "@/types/expense";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [newName, setNewName] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { symbol } = useCurrency();

  const categories = useLiveQuery(() => db.table("categories").toArray()) ?? [];

  async function handleAdd() {
    if (!newName.trim()) {
      setError("Category name is required");
      return;
    }
    const limit = parseFloat(newLimit);
    if (isNaN(limit) || limit < 0) {
      setError("Limit must be a non-negative number");
      return;
    }

    try {
      await db.table("categories").add({
        name: newName.trim(),
        maxAmount: limit,
      });
      setNewName("");
      setNewLimit("");
      setError(null);
      toast.success(`Category "${newName.trim()}" added`);
    } catch (e) {
      if (String(e).includes("ConstraintError")) {
        setError("Category already exists");
      } else {
        setError("Failed to add category");
      }
    }
  }

  async function handleDelete(id: number, name: string) {
    await db.table("categories").delete(id);
    toast.error(`Category "${name}" deleted`);
  }

  async function handleUpdateLimit(id: number, newLimit: string) {
    const limit = parseFloat(newLimit);
    if (!isNaN(limit) && limit >= 0) {
      await db.table("categories").update(id, { maxAmount: limit });
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Settings"
      dialogClassName="sm:max-w-md"
    >
      <div className="px-6 py-5 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 mb-4">Categories & Monthly Budgets</h3>
          
          {/* Add Category Form */}
          <div className="flex flex-col gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="cat-name" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-1">
                  Category Name
                </Label>
                <Input
                  id="cat-name"
                  placeholder="e.g. Food"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-xl border-zinc-200 bg-white shadow-sm h-9"
                />
              </div>
              <div className="w-28 space-y-1">
                <Label htmlFor="cat-limit" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-1">
                  Budget ({symbol})
                </Label>
                <Input
                  id="cat-limit"
                  type="number"
                  placeholder="0"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="rounded-xl border-zinc-200 bg-white shadow-sm h-9"
                />
              </div>
              <div className="flex items-end mb-0.5">
                <Button 
                  onClick={handleAdd}
                  size="icon"
                  className="h-9 w-9 bg-green-600 hover:bg-green-700 rounded-xl"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-red-500 ml-1">
                <AlertCircle size={12} />
                {error}
              </div>
            )}
          </div>

          {/* Categories List */}
          <div className="mt-6 space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {categories.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-8 bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200">
                No categories added yet.
              </p>
            ) : (
              categories.map((cat) => (
                <div 
                  key={cat.id} 
                  className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 hover:border-zinc-200 transition-colors bg-white group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 truncate">{cat.name}</p>
                    <p className="text-[10px] text-zinc-400">Monthly Limit: {symbol}{cat.maxAmount.toLocaleString()}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => cat.id && handleDelete(cat.id, cat.name)}
                      className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                      aria-label="Delete category"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100">
          <p className="text-[10px] text-zinc-400 text-center">
            Budgets are used to provide feedback when adding expenses.
          </p>
        </div>
      </div>
    </ResponsiveModal>
  );
}
