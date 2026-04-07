import { AccessDenied } from "@/components/AccessDenied";
import { sendNotification } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import styles from "../module.module.css";

export default async function NotificationsPage() {
  const session = await requireSession();
  if (!canAccess(session.role, "notifications")) {
    return <AccessDenied moduleName="notifications" />;
  }

  const notifications = await prisma.notification.findMany({
    where: session.role === "FOUNDER" ? {} : { userId: Number(session.sub) },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Notifications</h1>
      {(session.role === "FOUNDER" || session.role === "ADMIN_MANAGER" || session.role === "TEACHER") && (
        <section className={styles.section}>
          <h2>Send Announcement</h2>
          <form action={sendNotification} className={styles.formGrid}>
            <select name="targetRole" className={styles.select}>
              <option value="PARENT">Parents</option>
              <option value="STUDENT">Students</option>
              <option value="TEACHER">Teachers</option>
              <option value="ADMIN_MANAGER">Admin</option>
            </select>
            <input className={styles.input} name="title" placeholder="Title" required />
            <input className={styles.input} name="message" placeholder="Message" required />
            <button className={styles.button} type="submit">
              Send
            </button>
          </form>
        </section>
      )}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Message</th>
            <th>User</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map((item: any) => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td>{item.message}</td>
              <td>{item.user.name}</td>
              <td>{new Date(item.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
