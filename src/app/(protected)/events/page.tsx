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
      <h1 className={styles.title}>Events & Camps</h1>
      {(session.role === "FOUNDER" || session.role === "ADMIN_MANAGER" || session.role === "PRINCIPAL") && (
        <section className={styles.section}>
          <h2>Add Event</h2>
          <form className={styles.formGrid} action={addEvent}>
            <input className={styles.input} name="name" placeholder="Event name" required />
            <input className={styles.input} name="date" type="date" required />
            <input className={styles.input} name="description" placeholder="Description" required />
            <button className={styles.button} type="submit">
              Create Event
            </button>
          </form>
        </section>
      )}
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
  );
}
