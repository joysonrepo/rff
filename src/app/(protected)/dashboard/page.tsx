import { prisma } from "@/lib/prisma";
import { AccessDenied } from "@/components/AccessDenied";
import { canAccess } from "@/lib/permissions";
import { requireSession } from "@/lib/auth";
import styles from "../module.module.css";

const roleMessages = {
  FOUNDER: "Full operational control with complete analytics.",
  BOARD_DIRECTOR: "Strategic insights and growth trends.",
  ADMIN_MANAGER: "Day-to-day operations and approvals.",
  HR: "Staff lifecycle, attendance, and salary controls.",
  ACCOUNTS: "Fee collections, receipts, and finance reports.",
  PRINCIPAL: "Academic supervision and performance monitoring.",
  TEACHER: "Class management, attendance, and marks upload.",
  STAFF: "Your schedule, events, and announcements.",
  PARENT: "Child progress, attendance, and fee updates.",
  STUDENT: "Your attendance, marks, notes, and schedule.",
};

type BirthdayValue = Date | string | { toDate?: () => Date; _seconds?: number } | null | undefined;

function birthdayMonthAndDay(value: BirthdayValue): { month: number; day: number } | null {
  if (!value) return null;

  if (typeof value === "string") {
    const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateOnly) {
      return { month: Number(dateOnly[2]) - 1, day: Number(dateOnly[3]) };
    }
  }

  const timestamp = value instanceof Date
    ? value
    : typeof value === "object" && typeof value.toDate === "function"
      ? value.toDate()
      : typeof value === "object" && typeof value._seconds === "number"
        ? new Date(value._seconds * 1000)
        : typeof value === "string"
          ? new Date(value)
          : null;

  if (!timestamp || Number.isNaN(timestamp.getTime())) return null;
  return { month: timestamp.getUTCMonth(), day: timestamp.getUTCDate() };
}

function daysUntilBirthday(value: BirthdayValue): number | null {
  const birthday = birthdayMonthAndDay(value);
  if (!birthday) return null;
  const today = new Date();
  const nextBirthday = new Date(today.getFullYear(), birthday.month, birthday.day);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (nextBirthday < startOfToday) nextBirthday.setFullYear(today.getFullYear() + 1);
  return Math.round((nextBirthday.getTime() - startOfToday.getTime()) / 86400000);
}

function isBirthdayWithinNextWeek(value: BirthdayValue): boolean {
  const days = daysUntilBirthday(value);
  return days !== null && days >= 0 && days <= 7;
}

function birthdayLabel(value: BirthdayValue): string {
  const birthday = birthdayMonthAndDay(value);
  if (!birthday) return "";
  return `${String(birthday.day).padStart(2, "0")}/${String(birthday.month + 1).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const session = await requireSession();
  if (!(await canAccess(session.role, "dashboard"))) {
    return <AccessDenied moduleName="dashboard" />;
  }

  const [studentCount, staffCount, teacherCount, pendingEnrollments, feeAggregate, studentsWithBirthdays, staffWithBirthdays, teachersWithBirthdays] = await Promise.all([
    prisma.student.count(),
    prisma.staff.count(),
    prisma.teacher.count(),
    prisma.enrollment.count({ where: { status: "PENDING" } }),
    prisma.fee.aggregate({ _sum: { amount: true } }),
    prisma.student.findMany(),
    prisma.staff.findMany(),
    prisma.teacher.findMany(),
  ]);

  const birthdayStudents = studentsWithBirthdays
    .filter((student) => String(student.status ?? "").toUpperCase() !== "INACTIVE" && isBirthdayWithinNextWeek(student.dateOfBirth))
    .sort((left, right) => (daysUntilBirthday(left.dateOfBirth) ?? 99) - (daysUntilBirthday(right.dateOfBirth) ?? 99));
  const birthdayStaff = staffWithBirthdays
    .filter((staff) => String(staff.status ?? "").toUpperCase() !== "INACTIVE" && isBirthdayWithinNextWeek(staff.dateOfBirth))
    .sort((left, right) => (daysUntilBirthday(left.dateOfBirth) ?? 99) - (daysUntilBirthday(right.dateOfBirth) ?? 99));
  const birthdayTeachers = teachersWithBirthdays
    .filter((teacher) => isBirthdayWithinNextWeek(teacher.dateOfBirth))
    .sort((left, right) => (daysUntilBirthday(left.dateOfBirth) ?? 99) - (daysUntilBirthday(right.dateOfBirth) ?? 99));

  const cards = [
    { label: "Students", value: studentCount },
    { label: "Staff", value: staffCount },
    { label: "Teachers", value: teacherCount },
    { label: "Pending Enrollments", value: pendingEnrollments },
    { label: "Total Fee Logged", value: feeAggregate._sum.amount ?? 0 },
  ];

  const visibleCards = cards.filter((card) => {
    if (session.role === "BOARD_DIRECTOR") {
      return ["Students", "Pending Enrollments", "Total Fee Logged"].includes(card.label);
    }
    if (session.role === "PARENT" || session.role === "STUDENT") {
      return ["Students"].includes(card.label);
    }
    return true;
  });

  const [studentsAccess, staffAccess, attendanceAccess, feesAccess, reportsAccess] = await Promise.all([
    canAccess(session.role, "students"),
    canAccess(session.role, "staff"),
    canAccess(session.role, "attendance"),
    canAccess(session.role, "fees"),
    canAccess(session.role, "reports"),
  ]);
  const accessSummary = {
    students: studentsAccess,
    staff: staffAccess,
    attendance: attendanceAccess,
    fees: feesAccess,
    reports: reportsAccess,
  };

  return (
    <div className={styles.wrap}>
      <div>
        <p className={styles.subtitle}>{roleMessages[session.role]}</p>
      </div>

      <section className={styles.grid}>
        {visibleCards.map((card) => (
          <article key={card.label} className={styles.card}>
            <div className={styles.metric}>{card.value}</div>
            <div className={styles.label}>{card.label}</div>
          </article>
        ))}
      </section>

      {(birthdayStudents.length > 0 || birthdayStaff.length > 0 || birthdayTeachers.length > 0) && (
        <section className={styles.section}>
          <h2>Birthdays in the Next 7 Days</h2>
          <div className={styles.grid}>
            {birthdayStudents.map((student) => (
              <article key={`student-${student.name}`} className={styles.card}>
                <div className={styles.metric}>🎂</div>
                <div className={styles.label}>{student.name} - Class: {student.className ?? "-"} - {birthdayLabel(student.dateOfBirth)}</div>
              </article>
            ))}
            {birthdayStaff.map((staff) => (
              <article key={`staff-${staff.name}`} className={styles.card}>
                <div className={styles.metric}>🎂</div>
                <div className={styles.label}>{staff.name} - {birthdayLabel(staff.dateOfBirth)}</div>
              </article>
            ))}
            {birthdayTeachers.map((teacher) => (
              <article key={`teacher-${teacher.name}`} className={styles.card}>
                <div className={styles.metric}>🎂</div>
                <div className={styles.label}>{teacher.name} - {birthdayLabel(teacher.dateOfBirth)}</div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2>Module Access Snapshot</h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Module</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(accessSummary).map(([moduleName, allowed]) => (
                <tr key={moduleName}>
                  <td>{moduleName}</td>
                  <td>{allowed ? "Allowed" : "Read-only / blocked"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}