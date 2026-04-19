import { AccessDenied } from "@/components/AccessDenied";
import { RevenueChart } from "@/components/reports/RevenueChart";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import styles from "../module.module.css";

export default async function ReportsPage() {
  const session = await requireSession();
  if (!canAccess(session.role, "reports")) {
    return <AccessDenied moduleName="reports" />;
  }

  const [students, staff, attendance, fees, marks] = await Promise.all([
    prisma.student.count(),
    prisma.staff.count(),
    prisma.attendance.count(),
    prisma.fee.findMany(),
    prisma.mark.findMany(),
  ]);

  const revenueData = [
    { month: "Jan", revenue: 20000 },
    { month: "Feb", revenue: 26000 },
    { month: "Mar", revenue: 24000 },
    { month: "Apr", revenue: 32000 },
  ];

  const totalRevenue = fees.reduce((sum: number, fee: any) => sum + Number(fee.amount), 0);
  const averageMark = marks.length
    ? Math.round(marks.reduce((sum: number, mark: any) => sum + Number(mark.marks), 0) / marks.length)
    : 0;

  return (
    <div className={styles.wrap}>
      <section className={styles.grid}>
        <article className={styles.card}>
          <div className={styles.metric}>{students}</div>
          <div className={styles.label}>Students</div>
        </article>
        <article className={styles.card}>
          <div className={styles.metric}>{staff}</div>
          <div className={styles.label}>Staff</div>
        </article>
        <article className={styles.card}>
          <div className={styles.metric}>{attendance}</div>
          <div className={styles.label}>Attendance Entries</div>
        </article>
        <article className={styles.card}>
          <div className={styles.metric}>{totalRevenue}</div>
          <div className={styles.label}>Revenue</div>
        </article>
        <article className={styles.card}>
          <div className={styles.metric}>{averageMark}</div>
          <div className={styles.label}>Average Mark</div>
        </article>
      </section>
      <section className={styles.section}>
        <h2>Revenue Trend</h2>
        <RevenueChart data={revenueData} />
      </section>
    </div>
  );
}