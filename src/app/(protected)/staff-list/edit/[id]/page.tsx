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
  const accountUserId = staff ? staff.userId : staffId >= 1000000 ? staffId - 1000000 : null;
  const accountUser = !staff && accountUserId ? await prisma.user.findUnique({ where: { id: accountUserId } }) : null;

  if ((!staff && !accountUser) || staff?.status === "INACTIVE") {
    return (
      <div className={styles.wrap}>
        <section className={styles.section}>
          <h2>Staff not found</h2>
          <Link href="/staff-list">Back to Staff List</Link>
        </section>
      </div>
    );
  }

  const profile = staff ?? {
    id: staffId,
    name: accountUser?.name ?? "",
    status: "ACTIVE" as const,
    profileImage: null,
    role: accountUser?.role ?? "STAFF",
    salary: null,
    dateOfBirth: null,
    email: accountUser?.email ?? null,
    contactNumber: null,
    emergencyContact: null,
    address: null,
    city: null,
    state: null,
    qualification: null,
    experienceYears: null,
    joiningDate: null,
    userId: accountUserId,
    createdAt: accountUser?.createdAt ?? "",
    updatedAt: accountUser?.updatedAt ?? "",
  };
  const dobValue = toDateInputValue(profile.dateOfBirth);
  const joiningValue = toDateInputValue(profile.joiningDate);
  const selectedRole = roleToOptionValue(profile.role ?? "");

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
          <input type="hidden" name="staffId" value={profile.id} />
          <input type="hidden" name="accountUserId" value={accountUserId ?? ""} />
          <label>Name<input className={styles.input} name="name" defaultValue={profile.name ?? ""} required /></label>
          <label>Profile image<ValidatedProfileImageInput className={styles.input} /></label>
          <label>User role<select className={styles.select} name="role" defaultValue={selectedRole || ""} required>
            <option value="" disabled>
              Select user role
            </option>
            {roleOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select></label>
          <label>Salary<input className={styles.input} name="salary" type="number" min={0} step="0.01" defaultValue={profile.salary ?? ""} /></label>
          <label>Date of birth<input className={styles.input} name="dateOfBirth" type="date" defaultValue={dobValue} /></label>
          <label>Email<input className={styles.input} name="email" type="email" defaultValue={profile.email ?? ""} /></label>
          <label>Contact number<input className={styles.input} name="contactNumber" defaultValue={profile.contactNumber ?? ""} /></label>
          <label>Emergency contact<input className={styles.input} name="emergencyContact" defaultValue={profile.emergencyContact ?? ""} /></label>
          <label>Address<input className={styles.input} name="address" defaultValue={profile.address ?? ""} /></label>
          <label>City<input className={styles.input} name="city" defaultValue={profile.city ?? ""} /></label>
          <label>State<input className={styles.input} name="state" defaultValue={profile.state ?? ""} /></label>
          <label>Qualification<input className={styles.input} name="qualification" defaultValue={profile.qualification ?? ""} /></label>
          <label>Experience years<input className={styles.input} name="experienceYears" type="number" min={0} defaultValue={profile.experienceYears ?? ""} /></label>
          <label>Joining date<input className={styles.input} name="joiningDate" type="date" defaultValue={joiningValue} /></label>
          <label>Bank name<input className={styles.input} name="bankName" defaultValue={profile.bankName ?? ""} /></label>
          <label>Account holder name<input className={styles.input} name="accountHolderName" defaultValue={profile.accountHolderName ?? ""} /></label>
          <label>Bank account number<input className={styles.input} name="bankAccountNumber" defaultValue={profile.bankAccountNumber ?? ""} /></label>
          <label>IFSC code<input className={styles.input} name="bankIfscCode" defaultValue={profile.bankIfscCode ?? ""} /></label>
          <label>Bank branch<input className={styles.input} name="bankBranch" defaultValue={profile.bankBranch ?? ""} /></label>
          <button className={styles.button} type="submit">Save Changes</button>
        </form>
      </section>
    </div>
  );
}
