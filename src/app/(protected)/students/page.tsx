import { AccessDenied } from "@/components/AccessDenied";
import { addStudent } from "@/lib/actions";
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

export default async function StudentsPage() {
  const session = await requireSession();
  if (!canAccess(session.role, "students")) {
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

  return (
    <div className={styles.wrap}>
      {(session.role === "FOUNDER" || session.role === "ADMIN_MANAGER") && (
        <section className={styles.section}>
          <details className={styles.collapsible}>
            <summary className={styles.collapsibleSummary}>
              <h2 className={styles.collapsibleTitle}>Add Student</h2>
            </summary>
            <div className={styles.collapsibleBody}>
              <form action={addStudent} className={styles.formGrid}>
                <input className={styles.input} name="name" placeholder="Name" required />
                <input className={styles.input} name="profileImage" type="file" accept="image/*" />
                <input className={styles.input} name="className" placeholder="Class" required />
                <select className={styles.select} name="howDidYouHear" required>
                  <option value="">How did you hear about us?</option>
                  <option value="SOCIAL_MEDIA">Social media</option>
                  <option value="FRIEND_REFERRAL">Friend referral</option>
                  <option value="WALK_IN">Walk-in</option>
                  <option value="ONLINE_SEARCH">Online search</option>
                  <option value="OTHER">Other</option>
                </select>
                <select className={styles.select} name="enquiryStatus" required>
                  <option value="">Enquiry status</option>
                  <option value="NEW">New</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                  <option value="CONVERTED">Converted</option>
                </select>
                <input className={styles.input} name="dateOfBirth" type="date" required />
                <input className={styles.input} name="age" placeholder="Age" type="number" min={2} required />
                <input className={styles.input} name="city" placeholder="City" required />
                <input className={styles.input} name="state" placeholder="State" required />
                <input className={styles.input} name="residentialAddress" placeholder="Residential address" required />
                <input className={styles.input} name="permanentAddress" placeholder="Permanent address" required />
                <input className={styles.input} name="fatherName" placeholder="Father's name" required />
                <input className={styles.input} name="fatherEmail" placeholder="Father's email" type="email" required />
                <input className={styles.input} name="fatherMobile" placeholder="Father's mobile no." required />
                <input className={styles.input} name="motherName" placeholder="Mother's name" required />
                <input className={styles.input} name="motherEmail" placeholder="Mother's email" type="email" required />
                <input className={styles.input} name="motherMobile" placeholder="Mother's mobile no." required />
                <input className={styles.input} name="feeOffered" placeholder="Fee offered" type="number" min={0} step="0.01" required />
                <select className={styles.select} name="course">
                  <option value="MONTESSORI">Montessori</option>
                  <option value="MUSIC">Music</option>
                  <option value="TUITION">Tuition</option>
                </select>
                <button className={styles.button} type="submit">
                  Save Student
                </button>
              </form>
            </div>
          </details>
        </section>
      )}
      <section className={styles.section}>
        <StudentListTable students={students} showViewAction={false} />
      </section>
    </div>
  );
}