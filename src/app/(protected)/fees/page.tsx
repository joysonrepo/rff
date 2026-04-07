import { AccessDenied } from "@/components/AccessDenied";
import { addFee } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import styles from "../module.module.css";

export default async function FeesPage() {
  const session = await requireSession();
  if (!canAccess(session.role, "fees")) {
    return <AccessDenied moduleName="fees" />;
  }

  const [fees, students] = await Promise.all([
    prisma.fee.findMany({ include: { student: true }, orderBy: { id: "desc" } }),
    prisma.student.findMany({ select: { id: true, name: true } }),
  ]);

  const filteredFees =
    session.role === "PARENT"
      ? fees
      : session.role === "STUDENT"
        ? fees.filter((fee: any) => fee.student.userId === Number(session.sub))
        : fees;

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Fees Management</h1>
      {(session.role === "FOUNDER" || session.role === "ACCOUNTS") && (
        <section className={styles.section}>
          <h2>Record Payment</h2>
          <form className={styles.formGrid} action={addFee}>
            <select className={styles.select} name="studentId" required>
              <option value="">Select student</option>
              {students.map((student: any) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
            <input className={styles.input} name="amount" type="number" min={1} placeholder="Amount" required />
            <select className={styles.select} name="status">
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
            </select>
            <button className={styles.button} type="submit">
              Save Payment
            </button>
          </form>
        </section>
      )}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Student</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Receipt</th>
          </tr>
        </thead>
        <tbody>
          {filteredFees.map((fee: any) => (
            <tr key={fee.id}>
              <td>{fee.student.name}</td>
              <td>{fee.amount}</td>
              <td>{fee.status}</td>
              <td>{fee.receiptNo ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
