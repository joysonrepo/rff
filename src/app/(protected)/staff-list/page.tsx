import { AccessDenied } from "@/components/AccessDenied";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { StaffListTable } from "@/components/StaffListTable";
import styles from "../module.module.css";

function normalizeDateValue(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();

  if (typeof value === "object") {
    const maybeTimestamp = value as { toDate?: () => Date; _seconds?: number };
    if (typeof maybeTimestamp.toDate === "function") {
      return maybeTimestamp.toDate().toISOString();
    }
    if (typeof maybeTimestamp._seconds === "number") {
      return new Date(maybeTimestamp._seconds * 1000).toISOString();
    }
  }

  return null;
}

function normalizeStaff(staff: any[]): any[] {
  return staff.map((employee) => ({
    ...employee,
    dateOfBirth: normalizeDateValue(employee.dateOfBirth),
    joiningDate: normalizeDateValue(employee.joiningDate),
  }));
}

export default async function StaffListPage() {
  const session = await requireSession();
  if (!canAccess(session.role, "staffList")) {
    return <AccessDenied moduleName="staff" />;
  }

  const staff = await prisma.staff.findMany({ orderBy: { id: "desc" } });
  const normalizedStaff = normalizeStaff(staff).filter((employee: any) => employee.status !== "INACTIVE");
  const canManage = session.role === "FOUNDER" || session.role === "HR";

  return (
    <div className={styles.wrap}>
      <section className={styles.section}>
        <h2>Staff List</h2>
        <StaffListTable staff={normalizedStaff} showManageActions={canManage} />
      </section>
    </div>
  );
}
