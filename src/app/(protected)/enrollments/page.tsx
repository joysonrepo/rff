import { AccessDenied } from "@/components/AccessDenied";
import { reviewEnrollment } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import styles from "../module.module.css";

export default async function EnrollmentsPage() {
  const session = await requireSession();
  if (!canAccess(session.role, "enrollments")) {
    return <AccessDenied moduleName="enrollments" />;
  }

  const enrollments = await prisma.enrollment.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Parent</th>
            <th>Course</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map((enrollment: any) => (
            <tr key={enrollment.id}>
              <td>{enrollment.name}</td>
              <td>{enrollment.parentName}</td>
              <td>{enrollment.course}</td>
              <td>{enrollment.status}</td>
              <td>
                <form action={reviewEnrollment} style={{ display: "flex", gap: "0.5rem" }}>
                  <input type="hidden" name="enrollmentId" value={enrollment.id} />
                  <select name="status" className={styles.select} defaultValue={enrollment.status}>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approve</option>
                    <option value="REJECTED">Reject</option>
                  </select>
                  <button className={styles.button} type="submit">
                    Update
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
