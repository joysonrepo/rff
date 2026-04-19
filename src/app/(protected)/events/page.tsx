import { AccessDenied } from "@/components/AccessDenied";
import { addEvent } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import styles from "../module.module.css";

export default async function EventsPage() {
  const session = await requireSession();
  if (!canAccess(session.role, "events")) {
    return <AccessDenied moduleName="events" />;
  }

  const events = await prisma.event.findMany({ orderBy: { date: "asc" } });

  return (
    <div className={styles.wrap}>
      {(session.role === "FOUNDER" || session.role === "ADMIN_MANAGER" || session.role === "PRINCIPAL") && (
        <section className={styles.section}>
          <details className={styles.collapsible}>
            <summary className={styles.collapsibleSummary}>
              <h2 className={styles.collapsibleTitle}>Add Event</h2>
            </summary>
            <div className={styles.collapsibleBody}>
              <form className={styles.formGrid} action={addEvent}>
                <input className={styles.input} name="name" placeholder="Event name" required />
                <input className={styles.input} name="date" type="date" required />
                <input className={styles.input} name="description" placeholder="Description" required />
                <button className={styles.button} type="submit">
                  Create Event
                </button>
              </form>
            </div>
          </details>
        </section>
      )}
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Date</th>
              <th>Description</th>
              <th>Registrations</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event: any) => (
              <tr key={event.id}>
                <td>{event.name}</td>
                <td>{new Date(event.date).toLocaleDateString()}</td>
                <td>{event.description}</td>
                <td>{event.registrations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}