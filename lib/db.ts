// lib/db.ts

import Dexie, { type Table } from "dexie";
import type { Expense } from "@/types/expense";

export class ExpenseDatabase extends Dexie {
  expenses!: Table<Expense>;

  constructor() {
    super("ExpenseTrackerDB");
    this.version(2).stores({
      // Indexed columns: id (auto), monthKey, status, priority
      // Non-indexed columns are stored but not queryable by index
      expenses: "++id, monthKey, status, priority",
      categories: "++id, &name",
    });
  }
}

export const db = new ExpenseDatabase();
