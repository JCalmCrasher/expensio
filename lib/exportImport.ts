import { db } from "@/lib/db";
import type { Expense } from "@/types/expense";

export async function exportData(): Promise<string> {
  const expenses = await db.expenses.toArray();
  return JSON.stringify({ version: 1, expenses, exportedAt: Date.now() }, null, 2);
}

export async function importData(jsonString: string): Promise<{ imported: number; errors: string[] }> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.expenses || !Array.isArray(data.expenses)) {
      return { imported: 0, errors: ["Invalid format: missing expenses array"] };
    }

    const expenses = data.expenses as Expense[];
    const errors: string[] = [];
    let imported = 0;

    for (const expense of expenses) {
      try {
        // Strip id to let Dexie auto-increment
        const { id: _id, ...rest } = expense;
        await db.expenses.add(rest);
        imported++;
      } catch (err) {
        errors.push(`Failed to import "${expense.title}": ${String(err)}`);
      }
    }

    return { imported, errors };
  } catch (err) {
    return { imported: 0, errors: [`Parse error: ${String(err)}`] };
  }
}
