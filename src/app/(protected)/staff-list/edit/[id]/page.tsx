import Link from "next/link";
import { AccessDenied } from "@/components/AccessDenied";
import { ValidatedProfileImageInput } from "@/components/ValidatedProfileImageInput";
import { updateStaff } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "@/app/(protected)/module.module.css";

const roleOptions = [
  { value: "BOARD_DIRECTOR", label: "Board Director" },
  { value: "ADMIN_MANAGER", label: "Admin Manager" },
  { value: "HR", label: "HR" },
  { value: "ACCOUNTS", label: "Accounts" },
  { value: "PRINCIPAL", label: "Principal" },
  { value: "TEACHER", label: "Teacher" },
  { value: "STAFF", label: "Staff" },
  { value: "PARENT", label: "Parent" },
];

function roleToOptionValue(role: string): string {
  return role.trim().toUpperCase().replace(/\s+/g, "_");
}

function toDateInputValue(value: unknown): string {
  if (!value) return "";

  if (typeof value === "object") {
    const maybeTimestamp = value as { toDate?: () => Date; _seconds?: number };
    if (typeof maybeTimestamp.toDate === "function") {
      return maybeTimestamp.toDate().toISOString().slice(0, 10);
    }
    if (typeof maybeTimestamp._seconds === "number") {
      return new Date(maybeTimestamp._seconds * 1000).toISOString().slice(0, 10);
    }
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (!(session.role === "FOUNDER" || session.role === "HR")) {
    return <AccessDenied moduleName="staff" />;
  }

  const { id } = await params;
  const staffId = Number(id);
  const staff = await prisma.staff.findUnique({ where: { id: staffId } });

  if (!staff || staff.status === "INACTIVE") {
    return (
      <div className={styles.wrap}>
        <section className={styles.section}>
          <h2>Staff not found</h2>
          <Link href="/staff-list">Back to Staff List</Link>
        </section>
      </div>
    );
  }

  const dobValue = toDateInputValue(staff.dateOfBirth);
  const joiningValue = toDateInputValue(staff.joiningDate);
  const selectedRole = roleToOptionValue(staff.role ?? "");

  return (
    <div className={styles.wrap}>
      <section className={styles.section}>
        <div className={styles.dialogHeader}>
          <h2 className={styles.dialogTitle}>Edit Staff</h2>
          <Link href="/staff-list" className={styles.iconClose} aria-label="Close edit staff">
            x
          </Link>
        </div>
        <form action={updateStaff} className={styles.formGrid}>
          <input type="hidden" name="staffId" value={staff.id} />
          <input className={styles.input} name="name" defaultValue={staff.name ?? ""} placeholder="Name" required />
          <ValidatedProfileImageInput className={styles.input} />
          <select className={styles.select} name="role" defaultValue={selectedRole || ""} required>
            <option value="" disabled>
              Select user role
            </option>
            {roleOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <input className={styles.input} name="salary" type="number" min={0} step="0.01" defaultValue={staff.salary ?? ""} placeholder="Salary" />
          <input className={styles.input} name="dateOfBirth" type="date" defaultValue={dobValue} />
          <input className={styles.input} name="email" type="email" defaultValue={staff.email ?? ""} placeholder="Email" />
          <input className={styles.input} name="contactNumber" defaultValue={staff.contactNumber ?? ""} placeholder="Contact number" />
          <input className={styles.input} name="emergencyContact" defaultValue={staff.emergencyContact ?? ""} placeholder="Emergency contact" />
          <input className={styles.input} name="address" defaultValue={staff.address ?? ""} placeholder="Address" />
          <input className={styles.input} name="city" defaultValue={staff.city ?? ""} placeholder="City" />
          <input className={styles.input} name="state" defaultValue={staff.state ?? ""} placeholder="State" />
          <input className={styles.input} name="qualification" defaultValue={staff.qualification ?? ""} placeholder="Qualification" />
          <input className={styles.input} name="experienceYears" type="number" min={0} defaultValue={staff.experienceYears ?? ""} placeholder="Experience years" />
          <input className={styles.input} name="joiningDate" type="date" defaultValue={joiningValue} />
          <button className={styles.button} type="submit">Save Changes</button>
        </form>
      </section>
    </div>
  );
}
