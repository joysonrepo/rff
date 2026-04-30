import { AccessDenied } from "@/components/AccessDenied";
import { addFee } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { FeeListTable } from "@/components/FeeListTable";
import styles from "../module.module.css";

type FeeStudentRow = {
  id: number;
  name: string;
  userId?: number | null;
};

type FeeRow = {
  id: number;
  amount: number;
  status: string;
  receiptNo?: string | null;
  payeeName?: string | null;
  amountPaidFor?: string | null;
  modeOfPayment?: string | null;
  notes?: string | null;
  student: FeeStudentRow;
  dateOfPayment?: string | Date | null;
  paidOn?: string | Date | null;
  createdAt?: string | Date | null;
  invoiceFile?: string | null;
};

type StudentOptionRow = {
  id: number;
  name: string;
};

function toIsoOrNull(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  let dateValue: Date;

  if (value instanceof Date) {
    dateValue = value;
  } else if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    dateValue = (value as { toDate: () => Date }).toDate();
  } else {
    dateValue = new Date(value as string | number);
  }

  return Number.isNaN(dateValue.getTime()) ? null : dateValue.toISOString();
}

type NormalizedFeeRow = Omit<FeeRow, "dateOfPayment" | "paidOn" | "createdAt"> & {
  dateOfPayment?: string | null;
  paidOn?: string | null;
  createdAt?: string | null;
};

function normalizeFee(fee: FeeRow): NormalizedFeeRow {
  return {
    ...fee,
    dateOfPayment: toIsoOrNull(fee.dateOfPayment),
    paidOn: toIsoOrNull(fee.paidOn),
    createdAt: toIsoOrNull(fee.createdAt),
    invoiceFile: fee.invoiceFile ?? null,
  };
}

export default async function FeesPage() {
  const session = await requireSession();
  if (!canAccess(session.role, "fees")) {
    return <AccessDenied moduleName="fees" />;
  }

  const [fees, students] = await Promise.all([
    prisma.fee.findMany({ include: { student: true }, orderBy: { id: "desc" } }),
    prisma.student.findMany({ select: { id: true, name: true }, where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  const typedFees = fees as unknown as FeeRow[];
  const typedStudents = students as StudentOptionRow[];

  const filteredFees =
    session.role === "PARENT"
      ? typedFees
      : session.role === "STUDENT"
        ? typedFees.filter((fee) => fee.student.userId === Number(session.sub))
        : typedFees;

  const normalizedFees = filteredFees.map(normalizeFee);

  return (
    <div className={styles.wrap}>
      {(session.role === "FOUNDER" || session.role === "ACCOUNTS") && (
        <section className={styles.section}>
          <details className={styles.collapsible}>
            <summary className={styles.collapsibleSummary}>
              <h2 className={styles.collapsibleTitle}>Record Payment</h2>
            </summary>
            <div className={styles.collapsibleBody}>
              <form className={styles.formGrid} action={addFee}>
                <select className={styles.select} name="studentId" required>
                  <option value="">Select student</option>
                  {typedStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
                <input className={styles.input} name="payeeName" placeholder="Name of payee" />
                <input className={styles.input} name="amount" type="number" min={1} placeholder="Amount (?)" required />
                <input className={styles.input} name="amountPaidFor" placeholder="Amount paid for" />
                <input className={styles.input} name="dateOfPayment" type="date" />
                <select className={styles.select} name="modeOfPayment">
                  <option value="">-- Mode of payment --</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CARD">Card</option>
                  <option value="OTHER">Other</option>
                </select>
                <select className={styles.select} name="status">
                  <option value="PENDING">Pending</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="PAID">Paid</option>
                </select>
                <input className={styles.input} name="notes" placeholder="Notes (optional)" />
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.9rem", color: "#5b6372" }}>
                    Upload Invoice / Snapshot (optional, max 5 MB)
                  </label>
                  <input className={styles.input} name="invoiceFile" type="file" accept="image/*,.pdf" />
                </div>
                <button className={styles.button} type="submit">
                  Save Payment
                </button>
              </form>
            </div>
          </details>
        </section>
      )}
      <section className={styles.section}>
        <h2 style={{ marginBottom: "0.75rem" }}>Payment Records</h2>
        <FeeListTable fees={normalizedFees} />
      </section>
    </div>
  );
}
