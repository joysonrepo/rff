import Link from "next/link";
import { CSSProperties } from "react";
import { addEnrollment } from "@/lib/actions";

export default function EnrollmentPage() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1rem" }}>
      <form
        action={addEnrollment}
        style={{
          width: "min(600px, 96vw)",
          background: "#fff",
          border: "1px solid #ebdfcf",
          borderRadius: "14px",
          boxShadow: "0 10px 30px rgba(31, 42, 68, 0.08)",
          padding: "1.2rem",
          display: "grid",
          gap: "0.7rem",
        }}
      >
        <h1>Enrollment Form</h1>
        <p>Apply for Montessori, Music, or Tuition programs.</p>
        <input name="name" placeholder="Student name" required style={inputStyle} />
        <input name="parentName" placeholder="Parent name" required style={inputStyle} />
        <input name="email" type="email" placeholder="Parent email" required style={inputStyle} />
        <input name="age" type="number" min={2} max={18} placeholder="Age" required style={inputStyle} />
        <select name="course" style={inputStyle}>
          <option value="MONTESSORI">Montessori</option>
          <option value="MUSIC">Music</option>
          <option value="TUITION">Tuition</option>
        </select>
        <button type="submit" style={buttonStyle}>
          Submit Enrollment
        </button>
        <Link href="/login">Back to login</Link>
      </form>
    </div>
  );
}

const inputStyle: CSSProperties = {
  border: "1px solid #d7dce5",
  borderRadius: "8px",
  padding: "0.6rem",
  font: "inherit",
};

const buttonStyle: CSSProperties = {
  border: "none",
  borderRadius: "8px",
  padding: "0.65rem",
  fontWeight: 700,
  color: "#fff",
  background: "linear-gradient(90deg, #1f2a44, #2d4a7a)",
};
