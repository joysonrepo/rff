"use client";

import { usePathname } from "next/navigation";
import styles from "./AppShell.module.css";

const titleByPath: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/students": "Students",
  "/staff": "Staff & HR Management",
  "/attendance": "Attendance",
  "/fees": "Fees Management",
  "/reports": "Reports & Analytics",
  "/events": "Events & Camps",
  "/settings": "System Settings",
  "/enrollments": "Enrollment Workflow",
  "/courses": "Course & Batch Management",
  "/notifications": "Notifications",
  "/marks": "Marks & Performance",
};

export function PageHeaderTitle() {
  const pathname = usePathname();
  const title = titleByPath[pathname] ?? "Dashboard";

  return <h1 className={styles.pageTitle}>{title}</h1>;
}
