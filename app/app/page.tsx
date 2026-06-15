import { ExpenseAppShell } from "@/components/ExpenseAppShell";
import { NotificationManager } from "@/components/NotificationManager";
import { Toaster } from "@/components/ui/sonner";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";

export const metadata = {
  title: "Dashboard - Expensio",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent" as const,
    title: "Expensio",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
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
