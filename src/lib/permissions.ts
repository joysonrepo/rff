import { Role } from "@/lib/types";
import { prisma } from "@/lib/prisma";

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
  | "marks"
  | "achievements";

export async function canAccess(role: Role, module: AppModule): Promise<boolean> {
  const roleRecord = await prisma.role.findUnique({ where: { name: role } });
  const page = await prisma.page.findUnique({ where: { key: module } });
  if (!roleRecord || !page) return false;

  const access = await prisma.pageAccess.findFirst({ where: { roleId: roleRecord.id, pageId: page.id } });
  return Boolean(access);
}

export async function getAllowedModules(role: Role): Promise<AppModule[]> {
  const roleRecord = await prisma.role.findUnique({ where: { name: role } });
  if (!roleRecord) return [];

  const accesses = await prisma.pageAccess.findMany({ where: { roleId: roleRecord.id } });
  const accessIds = new Set(accesses.map((access) => access.pageId));
  const pages = await prisma.page.findMany({ orderBy: { id: "asc" } });
  return pages.filter((page) => accessIds.has(page.id)).map((page) => page.key as AppModule);
}
