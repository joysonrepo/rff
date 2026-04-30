import { AccessDenied } from "@/components/AccessDenied";
import { RevenueChart } from "@/components/reports/RevenueChart";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Fee, Mark, Staff } from "@/lib/types";
import styles from "../module.module.css";

type StaffSalaryRow = Pick<Staff, "name" | "role" | "salary">;

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes("\n") || value.includes("\"")) {
    return `"${value.replace(/\"/g, '""')}"`;
  }
  return value;
}

export default async function ReportsPage() {
  const session = await requireSession();
  if (!canAccess(session.role, "reports")) {
    return <AccessDenied moduleName="reports" />;
  }

  const [students, staff, attendance, fees, marks, staffForSalary] = await Promise.all([
    prisma.student.count(),
    prisma.staff.count(),
    prisma.attendance.count(),
    prisma.fee.findMany(),
    prisma.mark.findMany(),
    prisma.staff.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    }) as unknown as Promise<StaffSalaryRow[]>,
  ]);

  const revenueData = [
    { month: "Jan", revenue: 20000 },
    { month: "Feb", revenue: 26000 },
    { month: "Mar", revenue: 24000 },
    { month: "Apr", revenue: 32000 },
  ];

  const totalRevenue = fees.reduce((sum: number, fee: Fee) => sum + Number(fee.amount), 0);
  const averageMark = marks.length
    ? Math.round(marks.reduce((sum: number, mark: Mark) => sum + Number(mark.marks), 0) / marks.length)
    : 0;
  const totalPayroll = staffForSalary.reduce((sum: number, employee: StaffSalaryRow) => sum + Number(employee.salary ?? 0), 0);

  const staffSalaryCsvLines = [
    "Name,Role,Salary",
    ...staffForSalary.map((employee: StaffSalaryRow) => [
      csvEscape(String(employee.name ?? "")),
      csvEscape(String(employee.role ?? "")),
      String(employee.salary ?? ""),
    ].join(",")),
  ];
  const staffSalaryCsv = `data:text/csv;charset=utf-8,${encodeURIComponent(staffSalaryCsvLines.join("\n"))}`;

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
      <section className={styles.section}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Staff Salary Report</h2>
          <a className={styles.button} href={staffSalaryCsv} download="staff-salary-report.csv" style={{ textDecoration: "none", width: "auto", paddingInline: "0.9rem" }}>
            Export CSV
          </a>
        </div>
        <p className={styles.subtitle} style={{ marginTop: 0 }}>Total Monthly Salary: ₹{totalPayroll}</p>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Salary</th>
              </tr>
            </thead>
            <tbody>
              {staffForSalary.map((employee: StaffSalaryRow) => (
                <tr key={`${employee.name}-${employee.role}`}>
                  <td>{employee.name}</td>
                  <td>{employee.role}</td>
                  <td>{employee.salary != null ? `₹${employee.salary}` : "-"}</td>
                </tr>
              ))}
              {staffForSalary.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", color: "#888" }}>No active staff records.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}