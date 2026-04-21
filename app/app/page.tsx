import { ExpenseAppShell } from "@/components/ExpenseAppShell";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Dashboard - Expense Tracker",
};

export default function AppPage() {
  return (
    <>
      <ExpenseAppShell />
      <Toaster />
    </>
  );
}
