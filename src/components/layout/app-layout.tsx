import { AppShell } from "@/components/layout/app-shell";
import { requireAuth } from "@/lib/guards";

export async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  return <AppShell user={user}>{children}</AppShell>;
}
