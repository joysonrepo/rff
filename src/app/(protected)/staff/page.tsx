import { AccessDenied } from "@/components/AccessDenied";
import { addStaff } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Staff } from "@/lib/types";
import { StaffListTable } from "@/components/StaffListTable";
import { ValidatedProfileImageInput } from "@/components/ValidatedProfileImageInput";
import styles from "../module.module.css";

const addStaffRoleOptions = [
  { value: "BOARD_DIRECTOR", label: "Board Director" },
  { value: "ADMIN_MANAGER", label: "Admin Manager" },
  { value: "HR", label: "HR" },
  { value: "ACCOUNTS", label: "Accounts" },
  { value: "PRINCIPAL", label: "Principal" },
  { value: "TEACHER", label: "Teacher" },
  { value: "STAFF", label: "Staff" },
  { value: "PARENT", label: "Parent" },
];

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
              <form action={addStaff} className={styles.formGrid} autoComplete="off">
                <label>Name<input className={styles.input} name="name" required /></label>
                <label>Profile image<ValidatedProfileImageInput className={styles.input} /></label>
                <label>User role<select className={styles.select} name="role" defaultValue="" required>
                  <option value="" disabled>
                    Select user role
                  </option>
                  {addStaffRoleOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select></label>
                <label>Salary<input className={styles.input} name="salary" type="number" min={0} step="0.01" /></label>
                <label>Staff username<input className={styles.input} name="username" autoComplete="new-username" required /></label>
                <label>Staff password<input className={styles.input} name="password" type="password" autoComplete="new-password" required /></label>
                <label>Date of birth<input className={styles.input} name="dateOfBirth" type="date" /></label>
                <label>Email<input className={styles.input} name="email" type="email" /></label>
                <label>Contact number<input className={styles.input} name="contactNumber" /></label>
                <label>Emergency contact<input className={styles.input} name="emergencyContact" /></label>
                <label>Address<input className={styles.input} name="address" /></label>
                <label>City<input className={styles.input} name="city" /></label>
                <label>State<input className={styles.input} name="state" /></label>
                <label>Qualification<input className={styles.input} name="qualification" /></label>
                <label>Experience years<input className={styles.input} name="experienceYears" type="number" min={0} /></label>
                <label>Joining date<input className={styles.input} name="joiningDate" type="date" /></label>
                <label>Bank name<input className={styles.input} name="bankName" /></label>
                <label>Account holder name<input className={styles.input} name="accountHolderName" /></label>
                <label>Bank account number<input className={styles.input} name="bankAccountNumber" /></label>
                <label>IFSC code<input className={styles.input} name="bankIfscCode" /></label>
                <label>Bank branch<input className={styles.input} name="bankBranch" /></label>
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