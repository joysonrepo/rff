import { AccessDenied } from "@/components/AccessDenied";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { StudentListTable } from "@/components/StudentListTable";
import { Student } from "@/lib/types";
import styles from "../module.module.css";

type StudentListRow = Student & {
  parent?: {
    id: number;
    name: string;
  } | null;
};

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

function normalizeStudents(students: StudentListRow[]): StudentListRow[] {
  return students.map((student) => ({
    ...student,
    dateOfBirth: normalizeDateValue(student.dateOfBirth),
  }));
}

export default async function StudentListPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await requireSession();
  if (!canAccess(session.role, "studentList")) {
    return <AccessDenied moduleName="students" />;
  }

  let students = (await prisma.student.findMany({ include: { parent: true }, orderBy: { id: "desc" } }))
    .filter((student) => String(student.status ?? "").toUpperCase() !== "INACTIVE") as StudentListRow[];

  if (session.role === "PARENT") {
    const parent = await prisma.parent.findUnique({ where: { userId: Number(session.sub) } });
    students = students.filter((student) => student.parentId === parent?.id);
  }

  if (session.role === "STUDENT") {
    students = students.filter((student) => student.userId === Number(session.sub));
  }

  students = normalizeStudents(students);
  const params = await searchParams;
  const pageSize = 10;
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const totalPages = Math.max(1, Math.ceil(students.length / pageSize));
  const currentPage = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), totalPages) : 1;
  const pageStart = (currentPage - 1) * pageSize;
  const visibleStudents = students.slice(pageStart, pageStart + pageSize);
  const canManage = session.role === "FOUNDER" || session.role === "ADMIN_MANAGER";

  return (
    <div className={styles.wrap}>
      <section className={styles.section}>
        <div className={styles.listHeader}>
          <h2>Student List</h2>
          <nav className={styles.pagination} aria-label="Student list pages">
            {currentPage > 1 && <Link href={`/student-list?page=${currentPage - 1}`} className={styles.pageLink}>Previous</Link>}
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <Link key={page} href={`/student-list?page=${page}`} className={`${styles.pageLink} ${page === currentPage ? styles.pageLinkActive : ""}`}>
                {page}
              </Link>
            ))}
            {currentPage < totalPages && <Link href={`/student-list?page=${currentPage + 1}`} className={styles.pageLink}>Next</Link>}
          </nav>
        </div>
        <StudentListTable students={visibleStudents} showManageActions={canManage} />
      </section>
    </div>
  );
}