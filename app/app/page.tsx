import { ExpenseAppShell } from "@/components/ExpenseAppShell";
import { NotificationManager } from "@/components/NotificationManager";
import { Toaster } from "@/components/ui/sonner";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";

export const metadata = {
  title: "Dashboard - Expense Tracker",
};

export default function AppPage() {
  return (
    <>
      <ExpenseAppShell />
      <NotificationManager />
      <Toaster />
      <PWAUpdatePrompt />
    </>
  );
}
