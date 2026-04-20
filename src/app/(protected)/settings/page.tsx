import { AccessDenied } from "@/components/AccessDenied";
import { addUser, deleteUser } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { User } from "@/lib/types";
import styles from "../module.module.css";

export default async function SettingsPage() {
  const session = await requireSession();
  if (!canAccess(session.role, "settings")) {
    return <AccessDenied moduleName="settings" />;
  }

  const users = await prisma.user.findMany({ orderBy: { id: "desc" } });

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
        </>
      )}
    </div>
  );
}