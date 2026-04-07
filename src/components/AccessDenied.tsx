export function AccessDenied({ moduleName }: { moduleName: string }) {
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #ebdfcf",
        borderRadius: "14px",
        padding: "1rem",
      }}
    >
      <h1>Access restricted</h1>
      <p>You do not have access to the {moduleName} module.</p>
    </section>
  );
}
