"use client";

import { usePathname } from "next/navigation";
import styles from "./AppShell.module.css";

const titleByPath: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/students": "Students",
  "/student-list": "Student List",
  "/staff": "Staff & HR Management",
  "/staff-list": "Staff List",
  "/attendance": "Attendance",
  "/homework": "Homework",
  "/news": "Newslet",
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
  const title =
    titleByPath[pathname] ??
    (pathname.startsWith("/student-list/edit/") ? "Edit Student" : undefined) ??
    (pathname.startsWith("/staff-list/edit/") ? "Edit Staff" : undefined) ??
    "Dashboard";

  return <h1 className={styles.pageTitle}>{title}</h1>;
}
