import { ReactNode } from "react";
import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const userId = Number(session.sub);

  let profileImage: string | null = null;
  if (Number.isFinite(userId) && userId > 0) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!profileImage && user) {
      const [staffRows, studentRows] = await Promise.all([
        prisma.staff.findMany({ where: { status: "ACTIVE" } }),
        prisma.student.findMany({ where: { status: "ACTIVE" } }),
      ]);

      const staffMatch = staffRows.find(
        (staff) => staff.userId === user.id || staff.email === user.email || staff.name === user.name,
      );
      const studentMatch = studentRows.find((student) => student.userId === user.id || student.name === user.name);

      profileImage = staffMatch?.profileImage?.trim() || studentMatch?.profileImage?.trim() || null;
    }
  }

  return (
    <AppShell role={session.role} name={session.name} profileImage={profileImage}>
      {children}
    </AppShell>
  );
}