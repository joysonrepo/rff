import Link from "next/link";
import { AccessDenied } from "@/components/AccessDenied";
import { ValidatedProfileImageInput } from "@/components/ValidatedProfileImageInput";
import { updateStudent } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import styles from "@/app/(protected)/module.module.css";

function toDateInputValue(value: unknown): string {
  if (!value) return "";

  if (typeof value === "object") {
    const maybeTimestamp = value as { toDate?: () => Date; _seconds?: number };
    if (typeof maybeTimestamp.toDate === "function") {
      return maybeTimestamp.toDate().toISOString().slice(0, 10);
    }
    if (typeof maybeTimestamp._seconds === "number") {
      return new Date(maybeTimestamp._seconds * 1000).toISOString().slice(0, 10);
    }
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (!(await canAccess(session.role, "studentList")) || !(session.role === "FOUNDER" || session.role === "ADMIN_MANAGER")) {
    return <AccessDenied moduleName="students" />;
  }

  const { id } = await params;
  const studentId = Number(id);
  const student = await prisma.student.findUnique({ where: { id: studentId } });

  if (!student || student.status === "INACTIVE") {
    return (
      <div className={styles.wrap}>
        <section className={styles.section}>
          <h2>Student not found</h2>
          <Link href="/student-list">Back to Student List</Link>
        </section>
      </div>
    );
  }

  const dobValue = toDateInputValue(student.dateOfBirth);

  return (
    <div className={styles.wrap}>
      <section className={styles.section}>
        <div className={styles.dialogHeader}>
          <h2 className={styles.dialogTitle}>Edit Student</h2>
          <Link href="/student-list" className={styles.iconClose} aria-label="Close edit student">
            x
          </Link>
        </div>
        <form action={updateStudent} className={styles.formGrid}>
          <input type="hidden" name="studentId" value={student.id} />
          <label>Name<input className={styles.input} name="name" defaultValue={student.name ?? ""} required /></label>
          <label>Profile image<ValidatedProfileImageInput className={styles.input} /></label>
          <label>Class<input className={styles.input} name="className" defaultValue={student.className ?? ""} /></label>
          <label>How did you hear about us<input className={styles.input} name="howDidYouHear" defaultValue={student.howDidYouHear ?? ""} /></label>
          <label>Enquiry status<input className={styles.input} name="enquiryStatus" defaultValue={student.enquiryStatus ?? ""} /></label>
          <label>Date of birth<input className={styles.input} name="dateOfBirth" type="date" defaultValue={dobValue} /></label>
          <label>Age<input className={styles.input} name="age" type="number" min={2} defaultValue={student.age ?? 0} required /></label>
          <label>City<input className={styles.input} name="city" defaultValue={student.city ?? ""} /></label>
          <label>State<input className={styles.input} name="state" defaultValue={student.state ?? ""} /></label>
          <label>Residential address<input className={styles.input} name="residentialAddress" defaultValue={student.residentialAddress ?? ""} /></label>
          <label>Permanent address<input className={styles.input} name="permanentAddress" defaultValue={student.permanentAddress ?? ""} /></label>
          <label>Father&apos;s name<input className={styles.input} name="fatherName" defaultValue={student.fatherName ?? ""} /></label>
          <label>Father&apos;s email<input className={styles.input} name="fatherEmail" type="email" defaultValue={student.fatherEmail ?? ""} /></label>
          <label>Father&apos;s mobile<input className={styles.input} name="fatherMobile" defaultValue={student.fatherMobile ?? ""} /></label>
          <label>Mother&apos;s name<input className={styles.input} name="motherName" defaultValue={student.motherName ?? ""} /></label>
          <label>Mother&apos;s email<input className={styles.input} name="motherEmail" type="email" defaultValue={student.motherEmail ?? ""} /></label>
          <label>Mother&apos;s mobile<input className={styles.input} name="motherMobile" defaultValue={student.motherMobile ?? ""} /></label>
          <label>Fee offered<input className={styles.input} name="feeOffered" type="number" min={0} step="0.01" defaultValue={student.feeOffered ?? ""} /></label>
          <label>Course<select className={styles.select} name="course" defaultValue={student.course ?? "MONTESSORI"}>
            <option value="MONTESSORI">Montessori</option>
            <option value="MUSIC">Music</option>
            <option value="NEST">Nest</option>
            <option value="PSA">PSA</option>
          </select></label>
          <button className={styles.button} type="submit">Save Changes</button>
        </form>
      </section>
    </div>
  );
}
