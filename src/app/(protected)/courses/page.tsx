import { AccessDenied } from "@/components/AccessDenied";
import { addCourseBatch } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import styles from "../module.module.css";

type CourseBatchRow = {
  id: number;
  name: string;
  timing: string;
};

type CourseRow = {
  id: number;
  name: string;
  type: string;
  batches: CourseBatchRow[];
};

export default async function CoursesPage() {
  const session = await requireSession();
  if (!canAccess(session.role, "courses")) {
    return <AccessDenied moduleName="courses" />;
  }

  const courses = (await prisma.course.findMany({ include: { batches: true }, orderBy: { id: "desc" } })) as unknown as CourseRow[];

  return (
    <div className={styles.wrap}>
      <section className={styles.section}>
        <details className={styles.collapsible}>
          <summary className={styles.collapsibleSummary}>
            <h2 className={styles.collapsibleTitle}>Add Course + Batch</h2>
          </summary>
          <div className={styles.collapsibleBody}>
            <form className={styles.formGrid} action={addCourseBatch}>
              <input className={styles.input} name="name" placeholder="Course name" required />
              <select className={styles.select} name="type">
                <option value="MONTESSORI">Montessori</option>
                <option value="MUSIC">Music</option>
                <option value="TUITION">Tuition</option>
              </select>
              <input className={styles.input} name="batchName" placeholder="Batch name" required />
              <input className={styles.input} name="timing" placeholder="Timing" required />
              <button className={styles.button} type="submit">
                Save
              </button>
            </form>
          </div>
        </details>
      </section>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Course</th>
              <th>Type</th>
              <th>Batches</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.name}</td>
                <td>{course.type}</td>
                <td>{course.batches.map((batch) => `${batch.name} (${batch.timing})`).join(", ") || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}