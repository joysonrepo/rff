import Link from "next/link";
import { redirect } from "next/navigation";
import { CSSProperties } from "react";
import { getSession } from "@/lib/auth";

const shellStyle: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "1rem",
};

const cardStyle: CSSProperties = {
  width: "min(900px, 95vw)",
  background: "#fff",
  border: "1px solid #efe6da",
  borderRadius: "16px",
  padding: "2rem",
  boxShadow: "0 14px 40px rgba(31, 42, 68, 0.1)",
  display: "grid",
  gap: "1rem",
};

const ctaStyle: CSSProperties = {
  display: "inline-block",
  background: "linear-gradient(90deg, #1f2a44, #2d4a7a)",
  color: "#fff",
  borderRadius: "10px",
  padding: "0.65rem 1rem",
  fontWeight: 700,
};

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div style={shellStyle}>
      <section style={cardStyle}>
        <h1>ROL&apos;s Fun Factory</h1>
        <p>
          A full education and activity management platform for Montessori school, music programs,
          and post-school activities.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href="/login" style={ctaStyle}>
            Staff Login
          </Link>
          <Link href="/enroll" style={{ ...ctaStyle, background: "#f3b84e", color: "#1f2a44" }}>
            New Enrollment Form
          </Link>
        </div>
        <p>Demo credentials are seeded for each role. Default password: Welcome@123</p>
      </section>
    </div>
  );
}
