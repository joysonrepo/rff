import { AccessDenied } from "@/components/AccessDenied";
import { addAttendance } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
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
    prisma.student.findMany({ select: { id: true, name: true }, where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

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
              <form action={addAttendance} className={styles.formGrid}>
                <select className={styles.select} name="userId" required>
                  <option value="">Select User</option>
                  {users.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
                <select className={styles.select} name="studentId">
                  <option value="">Select Student (optional)</option>
                  {students.map((student: any) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
                <input className={styles.input} name="date" type="date" required defaultValue={todayValue()} />
                <select className={styles.select} name="targetType">
                  <option value="STUDENT">Student</option>
                  <option value="STAFF">Staff</option>
                </select>
                <select className={styles.select} name="status">
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                </select>
                <input className={styles.input} name="notes" placeholder="Notes" />
                <button className={styles.button} type="submit">
                  Save Attendance
                </button>
              </form>
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