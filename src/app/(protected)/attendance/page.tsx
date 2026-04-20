import { AccessDenied } from "@/components/AccessDenied";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AttendanceEntryForm } from "@/components/AttendanceEntryForm";
import styles from "../module.module.css";

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AttendancePage() {
  const session = await requireSession();
  if (!canAccess(session.role, "attendance")) {
    return <AccessDenied moduleName="attendance" />;
  }

  const [records, users, students] = await Promise.all([
    prisma.attendance.findMany({ include: { user: true, student: true }, orderBy: { date: "desc" }, take: 40 }),
    prisma.user.findMany({ select: { id: true, name: true, role: true } }),
    prisma.student.findMany({ select: { id: true, name: true, userId: true }, where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  const studentByUserId = new Map<number, { id: number; name: string }>();
  for (const student of students) {
    if (typeof student.userId === "number") {
      studentByUserId.set(student.userId, { id: student.id, name: student.name });
    }
  }

  const studentCandidates = users
    .filter((user: { role: string }) => user.role === "STUDENT")
    .map((user: { id: number; name: string }) => ({
      userId: user.id,
      studentId: studentByUserId.get(user.id)?.id ?? null,
      name: studentByUserId.get(user.id)?.name ?? user.name,
      role: "STUDENT" as const,
    }));

  const staffCandidates = users
    .filter((user: { role: string }) => user.role !== "STUDENT" && user.role !== "PARENT")
    .map((user: { id: number; name: string }) => ({
      userId: user.id,
      studentId: null,
      name: user.name,
      role: "STAFF" as const,
    }));

  const attendanceCandidates = [...studentCandidates, ...staffCandidates];

  const filteredRecords =
    session.role === "PARENT"
      ? records.filter((record: any) => record.user.role === "STUDENT")
      : session.role === "STUDENT"
        ? records.filter((record: any) => record.userId === Number(session.sub))
        : records;

  return (
    <div className={styles.wrap}>
      {(session.role === "FOUNDER" || session.role === "TEACHER" || session.role === "HR" || session.role === "ADMIN_MANAGER") && (
        <section className={styles.section}>
          <details className={styles.collapsible}>
            <summary className={styles.collapsibleSummary}>
              <h2 className={styles.collapsibleTitle}>Mark Attendance</h2>
            </summary>
            <div className={styles.collapsibleBody}>
              <AttendanceEntryForm candidates={attendanceCandidates} defaultDate={todayValue()} />
            </div>
          </details>
        </section>
      )}
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Status</th>
              <th>Type</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record: any) => (
              <tr key={record.id}>
                <td>{new Date(record.date).toLocaleDateString()}</td>
                <td>{record.user.name}</td>
                <td>{record.status}</td>
                <td>{record.targetType}</td>
                <td>{record.notes ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}