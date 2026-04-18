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
            <th>Student</th>
            <th>Class</th>
            <th>Parent</th>
            <th>Contact</th>
            <th>Course</th>
            <th>City</th>
            <th>Fee Offered</th>
            <th>Status</th>
            <th>Details</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map((enrollment: any) => (
            <tr key={enrollment.id}>
              <td>{enrollment.name}</td>
              <td>{enrollment.className ?? "-"}</td>
              <td>{enrollment.parentName ?? enrollment.fatherName ?? "-"}</td>
              <td>{enrollment.fatherMobile ?? enrollment.motherMobile ?? enrollment.email}</td>
              <td>{enrollment.course}</td>
              <td>{enrollment.city ?? "-"}</td>
              <td>{enrollment.feeOffered ?? "-"}</td>
              <td>{enrollment.status}</td>
              <td>
                <details>
                  <summary style={{ cursor: "pointer", color: "#1f2a44", fontWeight: 600 }}>View</summary>
                  <div style={{ marginTop: "0.5rem", display: "grid", gap: "0.35rem", whiteSpace: "normal", minWidth: "260px" }}>
                    <div>
                      <strong>How Heard:</strong> {enrollment.howDidYouHear ?? "-"}
                    </div>
                    <div>
                      <strong>Enquiry:</strong> {enrollment.enquiryStatus ?? "-"}
                    </div>
                    <div>
                      <strong>DOB:</strong> {enrollment.dateOfBirth ? new Date(enrollment.dateOfBirth).toLocaleDateString() : "-"}
                    </div>
                    <div>
                      <strong>Age:</strong> {enrollment.age}
                    </div>
                    <div>
                      <strong>State:</strong> {enrollment.state ?? "-"}
                    </div>
                    <div>
                      <strong>Residential:</strong> {enrollment.residentialAddress ?? "-"}
                    </div>
                    <div>
                      <strong>Permanent:</strong> {enrollment.permanentAddress ?? "-"}
                    </div>
                    <div>
                      <strong>Father:</strong> {enrollment.fatherName ?? "-"}
                    </div>
                    <div>
                      <strong>Father Email:</strong> {enrollment.fatherEmail ?? "-"}
                    </div>
                    <div>
                      <strong>Father Mobile:</strong> {enrollment.fatherMobile ?? "-"}
                    </div>
                    <div>
                      <strong>Mother:</strong> {enrollment.motherName ?? "-"}
                    </div>
                    <div>
                      <strong>Mother Email:</strong> {enrollment.motherEmail ?? "-"}
                    </div>
                    <div>
                      <strong>Mother Mobile:</strong> {enrollment.motherMobile ?? "-"}
                    </div>
                  </div>
                </details>
              </td>
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
