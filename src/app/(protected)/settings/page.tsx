import { AccessDenied } from "@/components/AccessDenied";
import { addPageAccess, addUser, deleteUser } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { User } from "@/lib/types";
import styles from "../module.module.css";

type SettingsPageProps = {
  searchParams: Promise<{ pageSearch?: string; roleSearch?: string }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const session = await requireSession();
  if (!(await canAccess(session.role, "settings"))) {
    return <AccessDenied moduleName="settings" />;
  }

  const [users, pages, roles] = await Promise.all([
    prisma.user.findMany({ orderBy: { id: "desc" } }),
    prisma.page.findMany({ orderBy: { id: "asc" } }),
    prisma.role.findMany({ orderBy: { id: "asc" } }),
  ]);
  const params = await searchParams;
  const pageSearch = String(params.pageSearch ?? "").trim().toLowerCase();
  const roleSearch = String(params.roleSearch ?? "").trim().toLowerCase();
  const visiblePages = pages.filter((page) =>
    !pageSearch || String(page.id) === pageSearch || page.label.toLowerCase().includes(pageSearch) || page.key.toLowerCase().includes(pageSearch),
  );
  const visibleRoles = roles.filter((role) =>
    !roleSearch || String(role.id) === roleSearch || role.name.toLowerCase().includes(roleSearch),
  );

  return (
    <div className={styles.wrap}>
      {session.role !== "FOUNDER" ? (
        <p className={styles.subtitle}>Only founder has full system controls.</p>
      ) : (
        <>
          <section className={styles.section}>
            <details className={styles.collapsible}>
              <summary className={styles.collapsibleSummary}>
                <h2 className={styles.collapsibleTitle}>Add User</h2>
              </summary>
              <div className={styles.collapsibleBody}>
                <form action={addUser} className={styles.formGrid}>
                  <input className={styles.input} name="name" placeholder="Name" required />
                  <input className={styles.input} name="email" type="email" placeholder="Email" required />
                  <input className={styles.input} name="password" type="password" placeholder="Password" required />
                  <select className={styles.select} name="role">
                    <option value="FOUNDER">Founder</option>
                    <option value="BOARD_DIRECTOR">Board Director</option>
                    <option value="ADMIN_MANAGER">Admin Manager</option>
                    <option value="HR">HR</option>
                    <option value="ACCOUNTS">Accounts</option>
                    <option value="PRINCIPAL">Principal</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="STAFF">Staff</option>
                    <option value="PARENT">Parent</option>
                    <option value="STUDENT">Student</option>
                  </select>
                  <button className={styles.button} type="submit">
                    Create User
                  </button>
                </form>
              </div>
            </details>
          </section>
          <section className={styles.section}>
            <h2>User Access Control</h2>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: User) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>
                        <form action={deleteUser}>
                          <input type="hidden" name="userId" value={user.id} />
                          <button className={styles.button} type="submit">
                            Remove
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className={styles.section}>
            <h2>Page Access Control</h2>
            <p className={styles.subtitle}>Search screens and roles by ID or name, then use their IDs to grant access.</p>
            <form method="get" className={styles.formGrid}>
              <input className={styles.input} name="pageSearch" placeholder="Search page ID or screen" />
              <input className={styles.input} name="roleSearch" placeholder="Search role ID or role" />
              <button className={styles.button} type="submit">Search</button>
            </form>
            <form action={addPageAccess} className={styles.formGrid}>
              <input className={styles.input} name="pageId" type="number" min="1" placeholder="Page ID" required />
              <input className={styles.input} name="roleId" type="number" min="1" placeholder="Role ID" required />
              <button className={styles.button} type="submit">Add Access</button>
            </form>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Screen ID</th><th>Screen</th></tr>
                </thead>
                <tbody>
                  {visiblePages.map((page) => (
                    <tr key={page.id}><td>{page.id}</td><td>{page.label}</td></tr>
                  ))}
                </tbody>
              </table>
              <table className={styles.table}>
                <thead><tr><th>Role ID</th><th>Role</th></tr></thead>
                <tbody>
                  {visibleRoles.map((role) => (
                    <tr key={role.id}><td>{role.id}</td><td>{role.name}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}