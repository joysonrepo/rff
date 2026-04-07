import { Role } from "@/lib/types";

export type AppModule =
  | "dashboard"
  | "students"
  | "staff"
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
  "staff",
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
  ADMIN_MANAGER: ["dashboard", "students", "attendance", "events", "enrollments", "courses", "notifications"],
  HR: ["dashboard", "staff", "attendance", "reports"],
  ACCOUNTS: ["dashboard", "fees", "reports", "staff"],
  PRINCIPAL: ["dashboard", "students", "attendance", "marks", "reports", "events"],
  TEACHER: ["dashboard", "students", "attendance", "marks", "events", "notifications"],
  PARENT: ["dashboard", "students", "attendance", "marks", "fees", "events", "notifications"],
  STUDENT: ["dashboard", "attendance", "marks", "events", "notifications"],
};

export function canAccess(role: Role, module: AppModule): boolean {
  return permissionMap[role].includes(module);
}

export function getAllowedModules(role: Role): AppModule[] {
  return permissionMap[role];
}
