import { AccessDenied } from "@/components/AccessDenied";
import { addMark } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import styles from "../module.module.css";

export default async function MarksPage() {
  const session = await requireSession();
  if (!canAccess(session.role, "marks")) {
    return <AccessDenied moduleName="marks" />;
  }

  const [students, marks] = await Promise.all([
    prisma.student.findMany({ select: { id: true, name: true, userId: true, parentId: true }, where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.mark.findMany({ include: { student: true }, orderBy: { id: "desc" } }),
  ]);

  let visibleMarks = marks;

  if (session.role === "STUDENT") {
    visibleMarks = marks.filter((item: any) => item.student.userId === Number(session.sub));
  }

  if (session.role === "PARENT") {
    const parent = await prisma.parent.findUnique({ where: { userId: Number(session.sub) } });
    visibleMarks = marks.filter((item: any) => item.student.parentId === parent?.id);
  }

  return (
    <div className={styles.wrap}>
      {(session.role === "FOUNDER" || session.role === "TEACHER" || session.role === "PRINCIPAL") && (
        <section className={styles.section}>
          <details className={styles.collapsible}>
            <summary className={styles.collapsibleSummary}>
              <h2 className={styles.collapsibleTitle}>Upload Marks</h2>
            </summary>
            <div className={styles.collapsibleBody}>
              <form className={styles.formGrid} action={addMark}>
                <select className={styles.select} name="studentId" required>
                  <option value="">Select student</option>
                  {students.map((student: any) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
                <input className={styles.input} name="subject" placeholder="Subject" required />
                <input className={styles.input} name="marks" type="number" min={0} max={100} required />
                <input className={styles.input} name="examType" placeholder="Exam type" />
                <button className={styles.button} type="submit">
                  Save Mark
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
              <th>Student</th>
              <th>Subject</th>
              <th>Marks</th>
              <th>Exam</th>
            </tr>
          </thead>
          <tbody>
            {visibleMarks.map((item: any) => (
              <tr key={item.id}>
                <td>{item.student.name}</td>
                <td>{item.subject}</td>
                <td>{item.marks}</td>
                <td>{item.examType ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}