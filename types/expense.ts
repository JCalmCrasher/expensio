export type Priority = "High" | "Medium" | "Low";
export type Status = "paid" | "unpaid";

export interface Expense {
  id?: number; // auto-incremented by Dexie
  title: string;
  totalAmount: number; // always > 0
  amountPaid: number; // 0 <= amountPaid <= totalAmount
  status: Status;
  priority: Priority;
  category: string; // free-text label; empty string if unset
  monthKey: string; // "YYYY-MM" — the month this expense belongs to
  rolledOver: boolean; // true if copied from a previous month
  createdAt: number; // Unix timestamp (ms)
  dueDate?: number | null; // optional due date, Unix timestamp (ms)
}

// NewExpense omits id and createdAt (set by the store on write)
export type NewExpense = Omit<Expense, "id" | "createdAt">;

// Computed from a set of Expense records
export interface MonthlySummary {
  totalOwed: number; // sum of totalAmount
  totalPaid: number; // sum of amountPaid
  progress: number; // totalPaid / totalOwed, in [0, 1]; 0 when totalOwed === 0
}
