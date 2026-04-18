import Link from "next/link";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAllowedModules } from "@/lib/permissions";
import { logoutUser } from "@/lib/auth";
import styles from "./AppShell.module.css";
import { AppModule } from "@/lib/permissions";
import { Role } from "@/lib/types";
import { AppShellClient } from "@/components/AppShellClient";
import { PageHeaderTitle } from "@/components/PageHeaderTitle";

type AppShellProps = {
  role: Role;
  name: string;
  children: ReactNode;
};

const routeMap: Record<AppModule, string> = {
  dashboard: "/dashboard",
  students: "/students",
  studentList: "/student-list",
  staff: "/staff",
  staffList: "/staff-list",
  attendance: "/attendance",
  fees: "/fees",
  reports: "/reports",
  events: "/events",
  settings: "/settings",
  enrollments: "/enrollments",
  courses: "/courses",
  notifications: "/notifications",
  marks: "/marks",
};

const labelMap: Record<AppModule, string> = {
  dashboard: "Dashboard",
  students: "Students",
  studentList: "Student List",
  staff: "Staff",
  staffList: "Staff List",
  attendance: "Attendance",
  fees: "Fees",
  reports: "Reports",
  events: "Events",
  settings: "Settings",
  enrollments: "Enrollments",
  courses: "Courses & Batches",
  notifications: "Notifications",
  marks: "Marks",
};

export function AppShell({ role, name, children }: AppShellProps) {
  const allowedModules = getAllowedModules(role);
  const canSeeStudentsMenu = allowedModules.includes("students") || allowedModules.includes("studentList");
  const canSeeStaffMenu = allowedModules.includes("staff") || allowedModules.includes("staffList");

  const menuModules = allowedModules.filter(
    (moduleName) => moduleName !== "students" && moduleName !== "studentList" && moduleName !== "staff" && moduleName !== "staffList",
  );

  async function doLogout() {
    "use server";
    await logoutUser();
    redirect("/login");
  }

  const sidebarContent = (
    <>
      <div className={styles.brand}>ROL&apos;s Fun Factory</div>
      <div className={styles.role}>{name} ({role})</div>
      <nav className={styles.menu}>
        {canSeeStudentsMenu && (
          <details className={styles.menuGroup} open>
            <summary className={styles.menuGroupTitle}>Students</summary>
            <div className={styles.subMenu}>
              {allowedModules.includes("students") && <Link href="/students">Add Student</Link>}
              {allowedModules.includes("studentList") && <Link href="/student-list">Student List</Link>}
            </div>
          </details>
        )}

        {canSeeStaffMenu && (
          <details className={styles.menuGroup} open>
            <summary className={styles.menuGroupTitle}>Staff</summary>
            <div className={styles.subMenu}>
              {allowedModules.includes("staff") && <Link href="/staff">Add Staff</Link>}
              {allowedModules.includes("staffList") && <Link href="/staff-list">Staff List</Link>}
            </div>
          </details>
        )}

        {menuModules.map((moduleName) => (
          <Link key={moduleName} href={routeMap[moduleName]}>
            {labelMap[moduleName]}
          </Link>
        ))}
      </nav>
    </>
  );

  return (
    <AppShellClient sidebarContent={sidebarContent}>
      <section className={styles.main}>
        <header className={styles.top}>
          <PageHeaderTitle />
          <form action={doLogout}>
            <button type="submit">Logout</button>
          </form>
        </header>
        <main className={styles.content}>{children}</main>
      </section>
    </AppShellClient>
  );
}
