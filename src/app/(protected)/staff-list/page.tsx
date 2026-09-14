import { AccessDenied } from "@/components/AccessDenied";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { StaffListTable } from "@/components/StaffListTable";
import { Role, Staff, User } from "@/lib/types";
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

type StaffListRow = Staff & {
  accountRole?: Role;
  isProfileManaged?: boolean;
};

function normalizeStaff(staff: StaffListRow[]): StaffListRow[] {
  return staff.map((employee) => ({
    ...employee,
    dateOfBirth: normalizeDateValue(employee.dateOfBirth),
    joiningDate: normalizeDateValue(employee.joiningDate),
  }));
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function mapUsersIntoStaffRows(staffRows: Staff[], users: User[]): StaffListRow[] {
  const eligibleUsers = users.filter((user) => user.role !== "STUDENT" && user.role !== "PARENT");

  const staffByUserId = new Map<number, Staff>();
  const staffByEmail = new Map<string, Staff>();
  const staffByName = new Map<string, Staff>();

  for (const employee of staffRows) {
    if (employee.userId != null) {
      staffByUserId.set(employee.userId, employee);
    }
    const emailKey = normalizeText(employee.email);
    if (emailKey) {
      staffByEmail.set(emailKey, employee);
    }
    const nameKey = normalizeText(employee.name);
    if (nameKey) {
      staffByName.set(nameKey, employee);
    }
  }

  const rows: StaffListRow[] = eligibleUsers.map((user) => {
    const match =
      staffByUserId.get(user.id) ||
      (normalizeText(user.email) ? staffByEmail.get(normalizeText(user.email)) : undefined) ||
      (normalizeText(user.name) ? staffByName.get(normalizeText(user.name)) : undefined);

    if (match) {
      return {
        ...match,
        accountRole: user.role,
        isProfileManaged: true,
      };
    }

    return {
      id: 1000000 + user.id,
      name: user.name,
      status: "ACTIVE",
      profileImage: null,
      role: user.role,
      salary: null,
      dateOfBirth: null,
      email: user.email,
      contactNumber: null,
      emergencyContact: null,
      address: null,
      city: null,
      state: null,
      qualification: null,
      experienceYears: null,
      joiningDate: null,
      userId: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      accountRole: user.role,
      isProfileManaged: false,
    };
  });

  return rows.sort((a, b) => b.id - a.id);
}

export default async function StaffListPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await requireSession();
  if (!(await canAccess(session.role, "staffList"))) {
    return <AccessDenied moduleName="staff" />;
  }

  const [staff, users] = await Promise.all([
    prisma.staff.findMany({ orderBy: { id: "desc" } }),
    prisma.user.findMany({ orderBy: { id: "desc" } }),
  ]);

  const mergedRows = mapUsersIntoStaffRows(staff as Staff[], users as User[]);
  const normalizedStaff = normalizeStaff(mergedRows).filter((employee) => employee.status !== "INACTIVE");
  const params = await searchParams;
  const pageSize = 10;
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const totalPages = Math.max(1, Math.ceil(normalizedStaff.length / pageSize));
  const currentPage = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), totalPages) : 1;
  const pageStart = (currentPage - 1) * pageSize;
  const visibleStaff = normalizedStaff.slice(pageStart, pageStart + pageSize);
  const canManage = session.role === "FOUNDER" || session.role === "HR";

  return (
    <div className={styles.wrap}>
      <section className={styles.section}>
        <div className={styles.listHeader}>
          <h2>Staff List</h2>
          <nav className={styles.pagination} aria-label="Staff list pages">
            {currentPage > 1 && <Link href={`/staff-list?page=${currentPage - 1}`} className={styles.pageLink}>Previous</Link>}
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <Link key={page} href={`/staff-list?page=${page}`} className={`${styles.pageLink} ${page === currentPage ? styles.pageLinkActive : ""}`}>
                {page}
              </Link>
            ))}
            {currentPage < totalPages && <Link href={`/staff-list?page=${currentPage + 1}`} className={styles.pageLink}>Next</Link>}
          </nav>
        </div>
        <StaffListTable staff={visibleStaff} showManageActions={canManage} />
      </section>
    </div>
  );
}