export const AmberBackdrop = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[140px] opacity-60"
      style={{ background: "radial-gradient(circle, hsl(var(--gold-glow) / 0.45), transparent 60%)" }}
    />
    <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
      style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)",
        backgroundSize: "32px 32px",
      }}
    />
  </div>
);
