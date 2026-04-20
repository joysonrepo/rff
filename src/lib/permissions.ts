import { Role } from "@/lib/types";

export type AppModule =
  | "dashboard"
  | "students"
  | "studentList"
  | "staff"
  | "staffList"
  | "attendance"
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
  BOARD_DIRECTOR: ["dashboard", "reports"],
  ADMIN_MANAGER: ["dashboard", "students", "studentList", "attendance", "events", "enrollments", "courses", "notifications"],
  HR: ["dashboard", "staff", "staffList", "attendance", "reports"],
  ACCOUNTS: ["dashboard", "fees", "reports", "staff", "staffList"],
  PRINCIPAL: ["dashboard", "students", "studentList", "attendance", "marks", "reports", "events"],
  TEACHER: ["dashboard", "students", "studentList", "attendance", "marks", "events", "notifications"],
  STAFF: ["dashboard", "events", "notifications"],
  PARENT: ["dashboard", "students", "studentList", "attendance", "marks", "fees", "events", "notifications"],
  STUDENT: ["dashboard", "attendance", "marks", "events", "notifications"],
};

export function canAccess(role: Role, module: AppModule): boolean {
  return permissionMap[role].includes(module);
}

export function getAllowedModules(role: Role): AppModule[] {
  return permissionMap[role];
}
