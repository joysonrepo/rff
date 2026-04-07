import { AccessDenied } from "@/components/AccessDenied";
import { addStudent } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import styles from "../module.module.css";

export default async function StudentsPage() {
  const session = await requireSession();
  if (!canAccess(session.role, "students")) {
    return <AccessDenied moduleName="students" />;
  }

  let students = await prisma.student.findMany({ include: { parent: true }, orderBy: { id: "desc" } });

  if (session.role === "PARENT") {
    const parent = await prisma.parent.findUnique({ where: { userId: Number(session.sub) } });
    students = students.filter((student: any) => student.parentId === parent?.id);
  }

  if (session.role === "STUDENT") {
    students = students.filter((student: any) => student.userId === Number(session.sub));
  }

  return (
    <div className={styles.wrap}>
      {(session.role === "FOUNDER" || session.role === "ADMIN_MANAGER") && (
        <section className={styles.section}>
          <h2>Add Student</h2>
          <form action={addStudent} className={styles.formGrid}>
            <input className={styles.input} name="name" placeholder="Name" required />
            <input className={styles.input} name="age" placeholder="Age" type="number" min={2} required />
            <select className={styles.select} name="course">
              <option value="MONTESSORI">Montessori</option>
              <option value="MUSIC">Music</option>
              <option value="TUITION">Tuition</option>
            </select>
            <button className={styles.button} type="submit">
              Save Student
            </button>
          </form>
        </section>
      )}
      <section>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Course</th>
              <th>Parent</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student: any) => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.age}</td>
                <td>{student.course}</td>
                <td>{student.parent?.name ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
