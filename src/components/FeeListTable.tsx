"use client";

import { useMemo, useState } from "react";
import styles from "@/app/(protected)/module.module.css";

type FeeWithStudent = {
  id: number;
  amount: number;
  status: string;
  receiptNo?: string | null;
  payeeName?: string | null;
  dateOfPayment?: string | null;
  amountPaidFor?: string | null;
  modeOfPayment?: string | null;
  notes?: string | null;
  invoiceFile?: string | null;
  paidOn?: string | null;
  createdAt?: string | null;
  student: { name: string };
};

export function FeeListTable({ fees }: { fees: FeeWithStudent[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useMemo(() => fees.find((f) => f.id === selectedId) ?? null, [fees, selectedId]);

  return (
    <>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Payee</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Mode</th>
              <th>Receipt</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((fee) => (
              <tr key={fee.id}>
                <td>{fee.student.name}</td>
                <td>{fee.payeeName ?? "-"}</td>
                <td>₹{fee.amount}</td>
                <td>{fee.status}</td>
                <td>{fee.modeOfPayment ?? "-"}</td>
                <td>{fee.receiptNo ?? "-"}</td>
                <td>{fee.dateOfPayment ? new Date(fee.dateOfPayment).toLocaleDateString() : "-"}</td>
                <td>
                  <button
                    type="button"
                    className={styles.button}
                    onClick={() => setSelectedId(fee.id)}
                  >
                    <span className={styles.actionButtonText}>View</span>
                    <span className={styles.actionButtonIcon}>View</span>
                  </button>
                </td>
              </tr>
            ))}
            {fees.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "#888" }}>No fee records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <dialog open className={styles.dialog}>
          <div className={styles.dialogHeader}>
            <h3 className={styles.dialogTitle}>Fee Details — {selected.receiptNo}</h3>
            <button
              type="button"
              className={styles.iconClose}
              onClick={() => setSelectedId(null)}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className={styles.profileGrid}>
            <div><strong>Student:</strong> {selected.student.name}</div>
            <div><strong>Payee Name:</strong> {selected.payeeName ?? "-"}</div>
            <div><strong>Amount:</strong> ₹{selected.amount}</div>
            <div><strong>Amount Paid For:</strong> {selected.amountPaidFor ?? "-"}</div>
            <div><strong>Mode of Payment:</strong> {selected.modeOfPayment ?? "-"}</div>
            <div><strong>Status:</strong> {selected.status}</div>
            <div><strong>Receipt No:</strong> {selected.receiptNo ?? "-"}</div>
            <div><strong>Date of Payment:</strong> {selected.dateOfPayment ? new Date(selected.dateOfPayment).toLocaleDateString() : "-"}</div>
            <div><strong>Paid On:</strong> {selected.paidOn ? new Date(selected.paidOn).toLocaleDateString() : "-"}</div>
            <div><strong>Notes:</strong> {selected.notes ?? "-"}</div>
            <div><strong>Created:</strong> {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "-"}</div>
            {selected.invoiceFile && (
              <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem" }}>
                <strong>Invoice / Snapshot:</strong>
                <div style={{ marginTop: "0.5rem" }}>
                  {selected.invoiceFile.startsWith("data:image/") ? (
                    <img
                      src={selected.invoiceFile}
                      alt="Invoice"
                      style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "8px", border: "1px solid #e0e7f0" }}
                    />
                  ) : (
                    <a
                      href={selected.invoiceFile}
                      download={`invoice-${selected.receiptNo ?? selected.id}.pdf`}
                      style={{ color: "#1f2a44", fontWeight: 600, textDecoration: "underline" }}
                    >
                      Download Invoice PDF
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </dialog>
      )}
    </>
  );
}
