import { AccessDenied } from "@/components/AccessDenied";
import { addStaff } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Staff } from "@/lib/types";
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

function normalizeStaff(staff: Staff[]): Staff[] {
  return staff.map((employee) => ({
    ...employee,
    dateOfBirth: normalizeDateValue(employee.dateOfBirth),
    joiningDate: normalizeDateValue(employee.joiningDate),
  }));
}

export default async function StaffPage() {
  const session = await requireSession();
  if (!canAccess(session.role, "staff")) {
    return <AccessDenied moduleName="staff" />;
  }

  const staff = await prisma.staff.findMany({ orderBy: { id: "desc" } });
  const normalizedStaff = normalizeStaff(staff).filter((employee: Staff) => employee.status !== "INACTIVE");

  return (
    <div className={styles.wrap}>
      {(session.role === "FOUNDER" || session.role === "HR") && (
        <section className={styles.section}>
          <details className={styles.collapsible}>
            <summary className={styles.collapsibleSummary}>
              <h2 className={styles.collapsibleTitle}>Add Staff</h2>
            </summary>
            <div className={styles.collapsibleBody}>
              <form action={addStaff} className={styles.formGrid}>
                <input className={styles.input} name="name" placeholder="Name" required />
                <input className={styles.input} name="profileImage" type="file" accept="image/*" />
                <input className={styles.input} name="role" placeholder="Role" required />
                <input className={styles.input} name="salary" type="number" min={0} step="0.01" placeholder="Salary" />
                <input className={styles.input} name="username" placeholder="Staff username" required />
                <input className={styles.input} name="password" type="password" placeholder="Staff password" required />
                <input className={styles.input} name="dateOfBirth" type="date" />
                <input className={styles.input} name="email" placeholder="Email" type="email" />
                <input className={styles.input} name="contactNumber" placeholder="Contact number" />
                <input className={styles.input} name="emergencyContact" placeholder="Emergency contact" />
                <input className={styles.input} name="address" placeholder="Address" />
                <input className={styles.input} name="city" placeholder="City" />
                <input className={styles.input} name="state" placeholder="State" />
                <input className={styles.input} name="qualification" placeholder="Qualification" />
                <input className={styles.input} name="experienceYears" type="number" min={0} placeholder="Experience years" />
                <input className={styles.input} name="joiningDate" type="date" />
                <button className={styles.button} type="submit">
                  Save Employee
                </button>
              </form>
            </div>
          </details>
        </section>
      )}
      <StaffListTable staff={normalizedStaff} showViewAction={false} />
    </div>
  );
}