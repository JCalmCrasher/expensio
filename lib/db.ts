// lib/db.ts

import Dexie, { type Table } from "dexie";
import type { Expense } from "@/types/expense";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from "@/types/notification";
import type { Category, ExpenseTemplate } from "@/types/expense";

export class ExpenseDatabase extends Dexie {
  expenses!: Table<Expense>;
  categories!: Table<Category>;
  settings!: Table<NotificationSettings>;
  templates!: Table<ExpenseTemplate>;

  constructor() {
    super("ExpenseTrackerDB");
    this.version(2).stores({
      expenses: "++id, monthKey, status, priority",
      categories: "++id, &name",
    });
    this.version(3).stores({
      expenses: "++id, monthKey, status, priority",
      categories: "++id, &name",
      settings: "id",
    }).upgrade(async (tx) => {
      await tx.table("settings").put({ ...DEFAULT_NOTIFICATION_SETTINGS });
    });
    this.version(4).stores({
      expenses: "++id, monthKey, status, priority",
      categories: "++id, &name",
      settings: "id",
      templates: "++id, title",
    });
  }
}

export const db = new ExpenseDatabase();
