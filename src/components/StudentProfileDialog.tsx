"use client";

import { useState } from "react";
import styles from "@/app/(protected)/module.module.css";
import { Student } from "@/lib/types";

type StudentWithParent = Student & { parent?: { name?: string | null } | null };

export function StudentProfileDialog({ student }: { student: StudentWithParent }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={styles.button} onClick={() => setOpen(true)}>
        <span className={styles.actionButtonText}>View Student</span>
        <span className={styles.actionButtonIcon}>View</span>
      </button>
      {open && (
        <dialog open className={styles.dialog}>
          <div className={styles.dialogHeader}>
            <h3 className={styles.dialogTitle}>Student Profile</h3>
            <button type="button" className={styles.iconClose} onClick={() => setOpen(false)} aria-label="Close dialog">x</button>
          </div>
          <div className={styles.profileWrap}>
            <img src={student.profileImage || "https://placehold.co/180x180/png?text=Student"} alt={`${student.name} profile`} className={styles.profileImage} />
            <div className={styles.profileGrid}>
              <div><strong>Name:</strong> {student.name}</div>
              <div><strong>Class:</strong> {student.className ?? "-"}</div>
              <div><strong>Age:</strong> {student.age}</div>
              <div><strong>Date of Birth:</strong> {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "-"}</div>
              <div><strong>Course:</strong> {student.course}</div>
              <div><strong>How Heard:</strong> {student.howDidYouHear ?? "-"}</div>
              <div><strong>Enquiry:</strong> {student.enquiryStatus ?? "-"}</div>
              <div><strong>City:</strong> {student.city ?? "-"}</div>
              <div><strong>State:</strong> {student.state ?? "-"}</div>
              <div><strong>Residential Address:</strong> {student.residentialAddress ?? "-"}</div>
              <div><strong>Permanent Address:</strong> {student.permanentAddress ?? "-"}</div>
              <div><strong>Father Name:</strong> {student.fatherName ?? "-"}</div>
              <div><strong>Father Email:</strong> {student.fatherEmail ?? "-"}</div>
              <div><strong>Father Mobile:</strong> {student.fatherMobile ?? "-"}</div>
              <div><strong>Mother Name:</strong> {student.motherName ?? "-"}</div>
              <div><strong>Mother Email:</strong> {student.motherEmail ?? "-"}</div>
              <div><strong>Mother Mobile:</strong> {student.motherMobile ?? "-"}</div>
              <div><strong>Fee Offered:</strong> {student.feeOffered ?? "-"}</div>
              <div><strong>Parent Account:</strong> {student.parent?.name ?? "-"}</div>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}