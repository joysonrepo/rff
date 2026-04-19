import { AccessDenied } from "@/components/AccessDenied";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { StudentListTable } from "@/components/StudentListTable";
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

function normalizeStudents(students: any[]): any[] {
  return students.map((student) => ({
    ...student,
    dateOfBirth: normalizeDateValue(student.dateOfBirth),
  }));
}

export default async function StudentListPage() {
  const session = await requireSession();
  if (!canAccess(session.role, "studentList")) {
    return <AccessDenied moduleName="students" />;
  }

  let students = await prisma.student.findMany({ include: { parent: true }, where: { status: "ACTIVE" }, orderBy: { id: "desc" } });

  if (session.role === "PARENT") {
    const parent = await prisma.parent.findUnique({ where: { userId: Number(session.sub) } });
    students = students.filter((student: any) => student.parentId === parent?.id);
  }

  if (session.role === "STUDENT") {
    students = students.filter((student: any) => student.userId === Number(session.sub));
  }

  students = normalizeStudents(students);
  const canManage = session.role === "FOUNDER" || session.role === "ADMIN_MANAGER";

  return (
    <div className={styles.wrap}>
      <section className={styles.section}>
        <h2>Student List</h2>
        <StudentListTable students={students} showManageActions={canManage} />
      </section>
    </div>
  );
}