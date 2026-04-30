"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "@/app/(protected)/module.module.css";
import { Staff } from "@/lib/types";
import { deactivateStaff } from "@/lib/actions";

type StaffListRow = Staff & {
  accountRole?: string;
  isProfileManaged?: boolean;
};

type StaffListTableProps = {
  staff: StaffListRow[];
  showViewAction?: boolean;
  showManageActions?: boolean;
};

export function StaffListTable({ staff, showViewAction = true, showManageActions = false }: StaffListTableProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);

  const selected = useMemo(
    () => staff.find((employee) => employee.id === selectedStaffId) ?? null,
    [staff, selectedStaffId],
  );

  return (
    <>
      <div className={styles.tableScroll}>
        <table className={styles.table} style={{ minWidth: "840px" }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Salary</th>
              <th>Contact</th>
              <th>Email</th>
              {(showViewAction || showManageActions) && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {staff.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.name}</td>
                <td>{employee.role}</td>
                <td>{employee.salary != null ? `₹${employee.salary}` : "-"}</td>
                <td>{employee.contactNumber ?? "-"}</td>
                <td>{employee.email ?? "-"}</td>
                {(showViewAction || showManageActions) && (
                  <td>
                    <div className={styles.actionRow}>
                      {showViewAction && (
                        <button type="button" className={styles.button} onClick={() => setSelectedStaffId(employee.id)}>
                          <span className={styles.actionButtonText}>View Staff</span>
                          <span className={styles.actionButtonIcon}>View</span>
                        </button>
                      )}
                      {showManageActions && employee.isProfileManaged !== false && (
                        <>
                          <Link href={`/staff-list/edit/${employee.id}`} className={styles.iconAction} aria-label="Edit staff" title="Edit staff">
                            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                              <path d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zm17.71-10.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.96 1.96 3.75 3.75 2.13-1.79z" fill="currentColor"/>
                            </svg>
                          </Link>
                          <form action={deactivateStaff}>
                            <input type="hidden" name="staffId" value={employee.id} />
                            <button type="submit" className={styles.iconActionDanger} aria-label="Delete staff" title="Set staff inactive">
                              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                <path d="M6 7h12v2H6V7zm2 3h8l-1 10H9L8 10zm3-6h2l1 1h4v2H6V5h4l1-1z" fill="currentColor"/>
                              </svg>
                            </button>
                          </form>
                        </>
                      )}
                      {showManageActions && employee.isProfileManaged === false && (
                        <span title="This account has no staff profile to edit." style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                          View only
                        </span>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showViewAction && selected && (
        <dialog open className={styles.dialog}>
          <div className={styles.dialogHeader}>
            <h3 className={styles.dialogTitle}>Staff Profile</h3>
            <button type="button" className={styles.iconClose} onClick={() => setSelectedStaffId(null)} aria-label="Close dialog">
              x
            </button>
          </div>

          <div className={styles.profileWrap}>
            <img
              src={selected.profileImage || "https://placehold.co/180x180/png?text=Staff"}
              alt={`${selected.name} profile`}
              className={styles.profileImage}
            />

            <div className={styles.profileGrid}>
              <div><strong>Name:</strong> {selected.name}</div>
              <div><strong>Role:</strong> {selected.role}</div>
              <div><strong>Account Role:</strong> {selected.accountRole ?? "-"}</div>
              <div><strong>Salary:</strong> {selected.salary != null ? `₹${selected.salary}` : "-"}</div>
              <div><strong>Date of Birth:</strong> {selected.dateOfBirth ? new Date(selected.dateOfBirth).toLocaleDateString() : "-"}</div>
              <div><strong>Email:</strong> {selected.email ?? "-"}</div>
              <div><strong>Contact Number:</strong> {selected.contactNumber ?? "-"}</div>
              <div><strong>Emergency Contact:</strong> {selected.emergencyContact ?? "-"}</div>
              <div><strong>Address:</strong> {selected.address ?? "-"}</div>
              <div><strong>City:</strong> {selected.city ?? "-"}</div>
              <div><strong>State:</strong> {selected.state ?? "-"}</div>
              <div><strong>Qualification:</strong> {selected.qualification ?? "-"}</div>
              <div><strong>Experience:</strong> {selected.experienceYears ?? "-"} years</div>
              <div><strong>Joining Date:</strong> {selected.joiningDate ? new Date(selected.joiningDate).toLocaleDateString() : "-"}</div>
              <div><strong>User Linked:</strong> {selected.userId ?? "-"}</div>
              <div><strong>Created At:</strong> {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "-"}</div>
              <div><strong>Updated At:</strong> {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : "-"}</div>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
