import Link from "next/link";
import { AccessDenied } from "@/components/AccessDenied";
import { addHomework } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { MultiStudentSelect } from "@/components/MultiStudentSelect";
import styles from "./homework.module.css";

const classOptions = ["KG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

type HomeworkSearchParams = {
  studentId?: string;
};

type HomeworkPageProps = {
  searchParams: Promise<HomeworkSearchParams>;
};

export default async function HomeworkPage({ searchParams }: HomeworkPageProps) {
  const session = await requireSession();
  if (!canAccess(session.role, "homework")) {
    return <AccessDenied moduleName="homework" />;
  }

  const params = await searchParams;
  const selectedStudentId = Number(params.studentId ?? 0);

  const [students, homeworkRows] = await Promise.all([
    prisma.student.findMany({
      select: { id: true, name: true, userId: true, parentId: true, className: true },
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
    prisma.homework.findMany({
      include: {
        student: { select: { id: true, name: true, userId: true, parentId: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { homeworkDate: "desc" },
    }),
  ]);

  let visibleHomework = homeworkRows;
  if (session.role === "STUDENT") {
    visibleHomework = homeworkRows.filter((item) => item.student.userId === Number(session.sub));
  } else if (session.role === "PARENT") {
    const parent = await prisma.parent.findUnique({ where: { userId: Number(session.sub) } });
    visibleHomework = homeworkRows.filter((item) => item.student.parentId === parent?.id);
  } else if (selectedStudentId) {
    visibleHomework = homeworkRows.filter((item) => item.studentId === selectedStudentId);
  }

  const canAdd =
    session.role === "FOUNDER" ||
    session.role === "ADMIN_MANAGER" ||
    session.role === "PRINCIPAL" ||
    session.role === "TEACHER";
  const hideSectionInView = session.role === "STUDENT";

  return (
    <div className={styles.wrap}>
      {canAdd && (
        <section className={styles.card}>
          <div className={styles.headerBand}>
            <div>
              <h2 className={styles.headerTitle}>Add Homework</h2>
              <p className={styles.headerSub}>Create and manage student homework easily</p>
            </div>
            <Link className={styles.backButton} href="/homework">
              Back to Listing
            </Link>
          </div>

          <div className={styles.body}>
            <form action={addHomework} className={styles.grid}>
              <div className={`${styles.field} ${styles.fieldThird}`}>
                <label className={styles.label} htmlFor="subjectName">
                  Subject Name <span className={styles.required}>*</span>
                </label>
                <input id="subjectName" className={styles.input} name="subjectName" placeholder="English" required />
              </div>

              <input type="hidden" name="sectionName" value="GENERAL" />

              <div className={`${styles.field} ${styles.fieldThird}`}>
                <label className={styles.label} htmlFor="className">
                  Class Name <span className={styles.required}>*</span>
                </label>
                <select id="className" className={styles.select} name="className" defaultValue="" required>
                  <option value="" disabled>
                    Select Class
                  </option>
                  {classOptions.map((className) => (
                    <option key={className} value={className}>
                      {className === "KG" ? "KG" : `Grade ${className}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`${styles.field} ${styles.fieldThird}`}>
                <label className={styles.label} htmlFor="studentIds">
                  Student Name List <span className={styles.required}>*</span>
                </label>
                <MultiStudentSelect students={students.map((student) => ({ id: student.id, name: student.name }))} />
                <small className={styles.helperText}>Select one or more students from the dropdown.</small>
              </div>

              <div className={`${styles.field} ${styles.fieldHalf}`}>
                <label className={styles.label} htmlFor="homeworkDate">
                  Homework Date <span className={styles.required}>*</span>
                </label>
                <input id="homeworkDate" className={styles.input} name="homeworkDate" type="date" required />
              </div>

              <div className={`${styles.field} ${styles.fieldHalf}`}>
                <label className={styles.label} htmlFor="submissionDate">
                  Submission Date <span className={styles.required}>*</span>
                </label>
                <input id="submissionDate" className={styles.input} name="submissionDate" type="date" required />
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="description">
                  Homework Description <span className={styles.required}>*</span>
                </label>
                <textarea id="description" className={styles.textarea} name="description" required />
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="attachmentFile">
                  Upload Attachment
                </label>
                <input id="attachmentFile" className={styles.file} name="attachmentFile" type="file" />
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <div className={styles.actions}>
                  <button className={styles.submit} type="submit">
                    Submit
                  </button>
                  <button className={styles.reset} type="reset">
                    Reset
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className={styles.listCard}>
        <h2>Homework List</h2>

        {session.role !== "STUDENT" && (
          <form className={styles.filterRow} method="get">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="filter-studentId">
                Student Name
              </label>
              <select id="filter-studentId" className={styles.select} name="studentId" defaultValue={selectedStudentId || ""}>
                <option value="">All Students</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
            <button className={styles.filterBtn} type="submit">
              View
            </button>
          </form>
        )}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Subject</th>
                {!hideSectionInView && <th>Section</th>}
                <th>Class</th>
                <th>Homework Date</th>
                <th>Submission Date</th>
                <th>Description</th>
                <th>Attachment</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {visibleHomework.map((item) => (
                <tr key={item.id}>
                  <td>{item.student.name}</td>
                  <td>{item.subjectName}</td>
                  {!hideSectionInView && <td>{item.sectionName}</td>}
                  <td>{item.className}</td>
                  <td>{new Date(item.homeworkDate).toLocaleDateString()}</td>
                  <td>{new Date(item.submissionDate).toLocaleDateString()}</td>
                  <td>{item.description}</td>
                  <td>
                    {item.attachmentFile ? (
                      <a href={item.attachmentFile} target="_blank" rel="noreferrer">
                        View File
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{item.createdBy.name}</td>
                </tr>
              ))}
              {visibleHomework.length === 0 && (
                <tr>
                  <td colSpan={hideSectionInView ? 8 : 9}>No homework records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
