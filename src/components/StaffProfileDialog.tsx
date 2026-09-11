"use client";

import { useState } from "react";
import styles from "@/app/(protected)/module.module.css";
import { Staff } from "@/lib/types";

type StaffWithAccount = Staff & { accountRole?: string };

export function StaffProfileDialog({ staff }: { staff: StaffWithAccount }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={styles.button} onClick={() => setOpen(true)}>
        <span className={styles.actionButtonText}>View Staff</span>
        <span className={styles.actionButtonIcon}>View</span>
      </button>
      {open && (
        <dialog open className={styles.dialog}>
          <div className={styles.dialogHeader}>
            <h3 className={styles.dialogTitle}>Staff Profile</h3>
            <button type="button" className={styles.iconClose} onClick={() => setOpen(false)} aria-label="Close dialog">x</button>
          </div>
          <div className={styles.profileWrap}>
            <img src={staff.profileImage || "https://placehold.co/180x180/png?text=Staff"} alt={`${staff.name} profile`} className={styles.profileImage} />
            <div className={styles.profileGrid}>
              <div><strong>Name:</strong> {staff.name}</div>
              <div><strong>Role:</strong> {staff.role}</div>
              <div><strong>Account Role:</strong> {staff.accountRole ?? "-"}</div>
              <div><strong>Salary:</strong> {staff.salary != null ? `₹${staff.salary}` : "-"}</div>
              <div><strong>Date of Birth:</strong> {staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString() : "-"}</div>
              <div><strong>Email:</strong> {staff.email ?? "-"}</div>
              <div><strong>Contact Number:</strong> {staff.contactNumber ?? "-"}</div>
              <div><strong>Emergency Contact:</strong> {staff.emergencyContact ?? "-"}</div>
              <div><strong>Address:</strong> {staff.address ?? "-"}</div>
              <div><strong>City:</strong> {staff.city ?? "-"}</div>
              <div><strong>State:</strong> {staff.state ?? "-"}</div>
              <div><strong>Qualification:</strong> {staff.qualification ?? "-"}</div>
              <div><strong>Experience:</strong> {staff.experienceYears ?? "-"} years</div>
              <div><strong>Joining Date:</strong> {staff.joiningDate ? new Date(staff.joiningDate).toLocaleDateString() : "-"}</div>
              <div><strong>User Linked:</strong> {staff.userId ?? "-"}</div>
              <div><strong>Created At:</strong> {staff.createdAt ? new Date(staff.createdAt).toLocaleString() : "-"}</div>
              <div><strong>Updated At:</strong> {staff.updatedAt ? new Date(staff.updatedAt).toLocaleString() : "-"}</div>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}