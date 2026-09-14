import { AccessDenied } from "@/components/AccessDenied";
import { addStudent } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Student } from "@/lib/types";
import { StudentListTable } from "@/components/StudentListTable";
import { ValidatedProfileImageInput } from "@/components/ValidatedProfileImageInput";
import styles from "../module.module.css";

type StudentWithParent = Student & {
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

function normalizeStudents(students: StudentWithParent[]): StudentWithParent[] {
  return students.map((student) => ({
    ...student,
    dateOfBirth: normalizeDateValue(student.dateOfBirth),
  }));
}

export default async function StudentsPage() {
  const session = await requireSession();
  if (!(await canAccess(session.role, "students"))) {
    return <AccessDenied moduleName="students" />;
  }

  let students = (await prisma.student.findMany({ include: { parent: true }, orderBy: { id: "desc" } }))
    .filter((student) => String(student.status ?? "").toUpperCase() !== "INACTIVE");

  if (session.role === "PARENT") {
    const parent = await prisma.parent.findUnique({ where: { userId: Number(session.sub) } });
    students = students.filter((student: StudentWithParent) => student.parentId === parent?.id);
  }

  if (session.role === "STUDENT") {
    students = students.filter((student: StudentWithParent) => student.userId === Number(session.sub));
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
              <form action={addStudent} className={styles.formGrid} autoComplete="off">
                <label>Name<input className={styles.input} name="name" required /></label>
                <label>Profile image<ValidatedProfileImageInput className={styles.input} /></label>
                <label>Class<input className={styles.input} name="className" required /></label>
                <label>How did you hear about us<select className={styles.select} name="howDidYouHear" required>
                  <option value="">How did you hear about us?</option>
                  <option value="SOCIAL_MEDIA">Social media</option>
                  <option value="FRIEND_REFERRAL">Friend referral</option>
                  <option value="WALK_IN">Walk-in</option>
                  <option value="ONLINE_SEARCH">Online search</option>
                  <option value="OTHER">Other</option>
                </select></label>
                <label>Enquiry status<select className={styles.select} name="enquiryStatus" required>
                  <option value="">Enquiry status</option>
                  <option value="NEW">New</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                  <option value="CONVERTED">Converted</option>
                </select></label>
                <label>Date of birth<input className={styles.input} name="dateOfBirth" type="date" required /></label>
                <label>Age<input className={styles.input} name="age" type="number" min={2} required /></label>
                <label>City<input className={styles.input} name="city" required /></label>
                <label>State<input className={styles.input} name="state" required /></label>
                <label>Residential address<input className={styles.input} name="residentialAddress" required /></label>
                <label>Permanent address<input className={styles.input} name="permanentAddress" required /></label>
                <label>Father&apos;s name<input className={styles.input} name="fatherName" required /></label>
                <label>Father&apos;s email<input className={styles.input} name="fatherEmail" type="email" required /></label>
                <label>Father&apos;s mobile number<input className={styles.input} name="fatherMobile" required /></label>
                <label>Mother&apos;s name<input className={styles.input} name="motherName" required /></label>
                <label>Mother&apos;s email<input className={styles.input} name="motherEmail" type="email" required /></label>
                <label>Mother&apos;s mobile number<input className={styles.input} name="motherMobile" required /></label>
                <label>Fee offered<input className={styles.input} name="feeOffered" type="number" min={0} step="0.01" required /></label>
                <label>Student username<input className={styles.input} name="username" autoComplete="new-username" required /></label>
                <label>Student password<input className={styles.input} name="password" type="password" autoComplete="new-password" required /></label>
                <label>Course<select className={styles.select} name="course">
                  <option value="MONTESSORI">Montessori</option>
                  <option value="MUSIC">Music</option>
                  <option value="NEST">Nest</option>
                  <option value="PSA">PSA</option>
                </select></label>
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