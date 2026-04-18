export default function ProtectedLoading() {
  return (
    <div style={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
      <div style={{ display: "grid", justifyItems: "center", gap: "0.8rem" }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "999px",
            border: "4px solid #d7dfec",
            borderTopColor: "#1f2a44",
            animation: "rff-spin 0.8s linear infinite",
          }}
        />
        <p style={{ margin: 0, color: "#4a5874", fontWeight: 600 }}>Loading...</p>
      </div>
      <style>{`@keyframes rff-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
