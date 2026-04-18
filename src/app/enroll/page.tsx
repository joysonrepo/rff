import Link from "next/link";
import { CSSProperties, ReactNode } from "react";
import { addEnrollment } from "@/lib/actions";

export default function EnrollmentPage() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1rem" }}>
      <form
        action={addEnrollment}
        style={{
          width: "min(1100px, 96vw)",
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
        <p>Fill all required fields to complete student admission enquiry.</p>

        <div style={grid3}>
          <Field label="Student Name*">
            <input name="name" placeholder="Student Name" required style={inputStyle} />
          </Field>
          <Field label="Class*">
            <input name="className" placeholder="Class" required style={inputStyle} />
          </Field>
          <Field label="How do you get to know about us?*">
            <select name="howDidYouHear" required style={inputStyle}>
              <option value="">Select Type</option>
              <option value="SOCIAL_MEDIA">Social Media</option>
              <option value="FRIEND_REFERRAL">Friend Referral</option>
              <option value="WALK_IN">Walk-in</option>
              <option value="ONLINE_SEARCH">Online Search</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>

          <Field label="Enquiry Status*">
            <select name="enquiryStatus" required style={inputStyle}>
              <option value="">Select Status</option>
              <option value="NEW">New</option>
              <option value="FOLLOW_UP">Follow-up</option>
              <option value="CONVERTED">Converted</option>
            </select>
          </Field>
          <Field label="Date Of Birth*">
            <input name="dateOfBirth" type="date" required style={inputStyle} />
          </Field>
          <Field label="Age*">
            <input name="age" type="number" min={2} max={18} placeholder="Age" required style={inputStyle} />
          </Field>

          <Field label="City*">
            <input name="city" placeholder="City" required style={inputStyle} />
          </Field>
          <Field label="State*">
            <input name="state" placeholder="State" required style={inputStyle} />
          </Field>
          <Field label="Course*">
            <select name="course" required style={inputStyle}>
              <option value="MONTESSORI">Montessori</option>
              <option value="MUSIC">Music</option>
              <option value="TUITION">Tuition</option>
            </select>
          </Field>
        </div>

        <Field label="Residential Address*">
          <input name="residentialAddress" placeholder="Residential Address" required style={inputStyle} />
        </Field>

        <Field label="Permanent Address*">
          <input name="permanentAddress" placeholder="Permanent Address" required style={inputStyle} />
        </Field>

        <div style={grid3}>
          <Field label="Father's Name*">
            <input name="fatherName" placeholder="Father's Name" required style={inputStyle} />
          </Field>
          <Field label="Father's E-mail*">
            <input name="fatherEmail" type="email" placeholder="Father's E-mail" required style={inputStyle} />
          </Field>
          <Field label="Father's Mobile No.*">
            <input name="fatherMobile" placeholder="Father's Mobile No." required style={inputStyle} />
          </Field>

          <Field label="Mother's Name*">
            <input name="motherName" placeholder="Mother's Name" required style={inputStyle} />
          </Field>
          <Field label="Mother's E-mail*">
            <input name="motherEmail" type="email" placeholder="Mother's E-mail" required style={inputStyle} />
          </Field>
          <Field label="Mother's Mobile No.*">
            <input name="motherMobile" placeholder="Mother's Mobile No." required style={inputStyle} />
          </Field>

          <Field label="Fee Offered*">
            <input name="feeOffered" type="number" min={0} step="0.01" placeholder="Fee Offered" required style={inputStyle} />
          </Field>
        </div>

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

const grid3: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "0.7rem",
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "grid", gap: "0.35rem", fontWeight: 600 }}>
      <span>{label}</span>
      {children}
    </label>
  );
}
