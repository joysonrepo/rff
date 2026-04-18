"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "@/app/(protected)/module.module.css";
import { Student } from "@/lib/types";
import { deactivateStudent } from "@/lib/actions";

type StudentWithParent = Student & {
  parent?: {
    name?: string | null;
  } | null;
};

type StudentListTableProps = {
  students: StudentWithParent[];
  showViewAction?: boolean;
  showManageActions?: boolean;
};

export function StudentListTable({ students, showViewAction = true, showManageActions = false }: StudentListTableProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const selected = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  return (
    <>
      <div className={styles.tableScroll}>
        <table className={styles.table} style={{ minWidth: "920px" }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Class</th>
              <th>Age</th>
              <th>Course</th>
              <th>City</th>
              <th>Fee Offered</th>
              <th>Parent</th>
              {(showViewAction || showManageActions) && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.className ?? "-"}</td>
                <td>{student.age}</td>
                <td>{student.course}</td>
                <td>{student.city ?? "-"}</td>
                <td>{student.feeOffered ?? "-"}</td>
                <td>{student.parent?.name ?? "-"}</td>
                {(showViewAction || showManageActions) && (
                  <td>
                    <div className={styles.actionRow}>
                      {showViewAction && (
                        <button type="button" className={styles.button} onClick={() => setSelectedStudentId(student.id)}>
                          <span className={styles.actionButtonText}>View Student</span>
                          <span className={styles.actionButtonIcon}>View</span>
                        </button>
                      )}
                      {showManageActions && (
                        <>
                          <Link href={`/student-list/edit/${student.id}`} className={styles.iconAction} aria-label="Edit student" title="Edit student">
                            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                              <path d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zm17.71-10.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.96 1.96 3.75 3.75 2.13-1.79z" fill="currentColor"/>
                            </svg>
                          </Link>
                          <form action={deactivateStudent}>
                            <input type="hidden" name="studentId" value={student.id} />
                            <button type="submit" className={styles.iconActionDanger} aria-label="Delete student" title="Set student inactive">
                              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                <path d="M6 7h12v2H6V7zm2 3h8l-1 10H9L8 10zm3-6h2l1 1h4v2H6V5h4l1-1z" fill="currentColor"/>
                              </svg>
                            </button>
                          </form>
                        </>
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
            <h3 className={styles.dialogTitle}>Student Profile</h3>
            <button type="button" className={styles.iconClose} onClick={() => setSelectedStudentId(null)} aria-label="Close dialog">
              x
            </button>
          </div>

          <div className={styles.profileWrap}>
            <img
              src={selected.profileImage || "https://placehold.co/180x180/png?text=Student"}
              alt={`${selected.name} profile`}
              className={styles.profileImage}
            />

            <div className={styles.profileGrid}>
              <div><strong>Name:</strong> {selected.name}</div>
              <div><strong>Class:</strong> {selected.className ?? "-"}</div>
              <div><strong>Age:</strong> {selected.age}</div>
              <div><strong>Date of Birth:</strong> {selected.dateOfBirth ? new Date(selected.dateOfBirth).toLocaleDateString() : "-"}</div>
              <div><strong>Course:</strong> {selected.course}</div>
              <div><strong>How Heard:</strong> {selected.howDidYouHear ?? "-"}</div>
              <div><strong>Enquiry:</strong> {selected.enquiryStatus ?? "-"}</div>
              <div><strong>City:</strong> {selected.city ?? "-"}</div>
              <div><strong>State:</strong> {selected.state ?? "-"}</div>
              <div><strong>Residential Address:</strong> {selected.residentialAddress ?? "-"}</div>
              <div><strong>Permanent Address:</strong> {selected.permanentAddress ?? "-"}</div>
              <div><strong>Father Name:</strong> {selected.fatherName ?? "-"}</div>
              <div><strong>Father Email:</strong> {selected.fatherEmail ?? "-"}</div>
              <div><strong>Father Mobile:</strong> {selected.fatherMobile ?? "-"}</div>
              <div><strong>Mother Name:</strong> {selected.motherName ?? "-"}</div>
              <div><strong>Mother Email:</strong> {selected.motherEmail ?? "-"}</div>
              <div><strong>Mother Mobile:</strong> {selected.motherMobile ?? "-"}</div>
              <div><strong>Fee Offered:</strong> {selected.feeOffered ?? "-"}</div>
              <div><strong>Parent Account:</strong> {selected.parent?.name ?? "-"}</div>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
