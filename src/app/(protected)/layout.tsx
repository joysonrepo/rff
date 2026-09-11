import { ReactNode } from "react";
import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { consumeFlashMessage } from "@/lib/flash";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const userId = Number(session.sub);
  const flashPromise = consumeFlashMessage();

  let profileImage: string | null = null;
  let totalStars: number | undefined = undefined;
  let flash = null;

  if (Number.isFinite(userId) && userId > 0) {
    const [flashMessage, staff, student] = await Promise.all([
      flashPromise,
      session.role === "STUDENT" ? Promise.resolve(null) : prisma.staff.findUnique({ where: { userId } }),
      session.role === "STUDENT" ? prisma.student.findUnique({ where: { userId } }) : Promise.resolve(null),
    ]);

    flash = flashMessage;
    profileImage = staff?.profileImage?.trim() || student?.profileImage?.trim() || null;
    if (session.role === "STUDENT" && student) {
      const agg = await prisma.taskAssignment.aggregate({
        where: { studentId: student.id, status: "APPROVED" },
        _sum: { starsAwarded: true },
      });
      totalStars = agg._sum.starsAwarded ?? 0;
    }
  } else {
    flash = await flashPromise;
  }

  return (
    <AppShell role={session.role} name={session.name} profileImage={profileImage} flash={flash} totalStars={totalStars}>
      {children}
    </AppShell>
  );
}