import { ReactNode } from "react";
import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  return (
    <AppShell role={session.role} name={session.name}>
      {children}
    </AppShell>
  );
}