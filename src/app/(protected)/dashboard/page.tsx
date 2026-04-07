import { prisma } from "@/lib/prisma";
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
  PARENT: "Child progress, attendance, and fee updates.",
  STUDENT: "Your attendance, marks, notes, and schedule.",
};

export default async function DashboardPage() {
  const session = await requireSession();

  const [studentCount, staffCount, teacherCount, pendingEnrollments, feeAggregate] = await Promise.all([
    prisma.student.count(),
    prisma.staff.count(),
    prisma.teacher.count(),
    prisma.enrollment.count({ where: { status: "PENDING" } }),
    prisma.fee.aggregate({ _sum: { amount: true } }),
  ]);

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

  const accessSummary = {
    students: canAccess(session.role, "students"),
    staff: canAccess(session.role, "staff"),
    attendance: canAccess(session.role, "attendance"),
    fees: canAccess(session.role, "fees"),
    reports: canAccess(session.role, "reports"),
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

      <section className={styles.section}>
        <h2>Module Access Snapshot</h2>
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
      </section>
    </div>
  );
}
