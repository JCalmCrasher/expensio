import type { Expense } from "@/types/expense";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NOTIFICATION_SETTINGS_ID,
  type NotificationSettings,
} from "@/types/notification";
import type { Currency } from "@/store/useExpenseStore";

const DB_NAME = "ExpenseTrackerDB";
const STORE_EXPENSES = "expenses";
const STORE_SETTINGS = "settings";
const CURRENCY_STORAGE_KEY = "expensio-store-v1";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

function readCurrencyFromLocalStorage(): Currency {
  if (typeof localStorage === "undefined") return "NGN";
  try {
    const raw = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (!raw) return "NGN";
    const parsed = JSON.parse(raw) as { state?: { currency?: Currency } };
    return parsed.state?.currency === "USD" ? "USD" : "NGN";
  } catch {
    return "NGN";
  }
}

export async function loadNotificationDataFromIdb(): Promise<{
  expenses: Expense[];
  settings: NotificationSettings;
  currency: Currency;
}> {
  const database = await openDb();
  try {
    const expenses = await new Promise<Expense[]>((resolve, reject) => {
      const tx = database.transaction(STORE_EXPENSES, "readonly");
      const req = tx.objectStore(STORE_EXPENSES).getAll();
      req.onsuccess = () => resolve(req.result as Expense[]);
      req.onerror = () => reject(req.error);
    });

    let settings = await new Promise<NotificationSettings | undefined>((resolve, reject) => {
      if (!database.objectStoreNames.contains(STORE_SETTINGS)) {
        resolve(undefined);
        return;
      }
      const tx = database.transaction(STORE_SETTINGS, "readonly");
      const req = tx.objectStore(STORE_SETTINGS).get(NOTIFICATION_SETTINGS_ID);
      req.onsuccess = () => resolve(req.result as NotificationSettings | undefined);
      req.onerror = () => reject(req.error);
    });

    if (!settings) {
      settings = { ...DEFAULT_NOTIFICATION_SETTINGS };
    }

    const currency =
      settings.currency === "USD" || settings.currency === "NGN"
        ? settings.currency
        : readCurrencyFromLocalStorage();

    return {
      expenses,
      settings: { ...settings, currency },
      currency,
    };
  } finally {
    database.close();
  }
}
