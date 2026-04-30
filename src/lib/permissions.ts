import { Role } from "@/lib/types";

export type AppModule =
  | "dashboard"
  | "students"
  | "studentList"
  | "staff"
  | "staffList"
  | "attendance"
  | "homework"
  | "news"
  | "fees"
  | "reports"
  | "events"
  | "settings"
  | "enrollments"
  | "courses"
  | "notifications"
  | "marks";

const allModules: AppModule[] = [
  "dashboard",
  "students",
  "studentList",
  "staff",
  "staffList",
  "attendance",
  "homework",
  "news",
  "fees",
  "reports",
  "events",
  "settings",
  "enrollments",
  "courses",
  "notifications",
  "marks",
];

const permissionMap: Record<Role, AppModule[]> = {
  FOUNDER: allModules,
  BOARD_DIRECTOR: ["dashboard", "news", "reports"],
  ADMIN_MANAGER: ["dashboard", "students", "studentList", "attendance", "homework", "news", "events", "enrollments", "courses", "notifications"],
  HR: ["dashboard", "staff", "staffList", "attendance", "news", "reports"],
  ACCOUNTS: ["dashboard", "fees", "news", "reports", "staff", "staffList"],
  PRINCIPAL: ["dashboard", "students", "studentList", "attendance", "homework", "news", "marks", "reports", "events"],
  TEACHER: ["dashboard", "students", "studentList", "attendance", "homework", "news", "marks", "events", "notifications"],
  STAFF: ["dashboard", "attendance", "news", "events", "notifications", "marks"],
  PARENT: ["dashboard", "students", "studentList", "attendance", "news", "marks", "fees", "events", "notifications"],
  STUDENT: ["dashboard", "attendance", "homework", "news", "marks", "events", "notifications"],
};

export function canAccess(role: Role, module: AppModule): boolean {
  return permissionMap[role].includes(module);
}

export function getAllowedModules(role: Role): AppModule[] {
  return permissionMap[role];
}
