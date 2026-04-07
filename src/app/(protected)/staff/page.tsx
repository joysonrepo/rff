import { AccessDenied } from "@/components/AccessDenied";
import { addStaff } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import styles from "../module.module.css";

export default async function StaffPage() {
  const session = await requireSession();
  if (!canAccess(session.role, "staff")) {
    return <AccessDenied moduleName="staff" />;
  }

  const staff = await prisma.staff.findMany({ orderBy: { id: "desc" } });

  return (
    <div className={styles.wrap}>
      {(session.role === "FOUNDER" || session.role === "HR") && (
        <section className={styles.section}>
          <h2>Add Employee</h2>
          <form action={addStaff} className={styles.formGrid}>
            <input className={styles.input} name="name" placeholder="Name" required />
            <input className={styles.input} name="role" placeholder="Role" required />
            <button className={styles.button} type="submit">
              Save Employee
            </button>
          </form>
        </section>
      )}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((employee: any) => (
            <tr key={employee.id}>
              <td>{employee.name}</td>
              <td>{employee.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
