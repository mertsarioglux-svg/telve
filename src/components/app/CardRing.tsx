/** Tasarımdaki "Fincan halkası" kart görseli: damga sayısı kadar dolan halka. */
export function CardRing({ stamps, goal, round, dark = true }: { stamps: number; goal: number; round: number; dark?: boolean }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const line = dark ? "#fff" : "var(--telve)";
  const soft = dark ? "var(--telve-300)" : "var(--telve-600)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <svg width="116" height="116" viewBox="0 0 116 116" role="img" aria-label={`${stamps} / ${goal} damga`} style={{ flex: "none" }}>
        <circle cx="58" cy="58" r={r} fill="none" stroke={line} strokeWidth="4" opacity=".28" />
        <circle
          cx="58"
          cy="58"
          r={r}
          fill="none"
          stroke={line}
          strokeWidth="4"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - stamps / goal)}
          transform="rotate(-90 58 58)"
          style={{ transition: "stroke-dashoffset .5s cubic-bezier(.2,.8,.2,1)" }}
        />
        <text x="58" y="66" textAnchor="middle" fill={line} style={{ font: "800 26px var(--font-archivo), system-ui", letterSpacing: "-1px" }}>
          {stamps}/{goal}
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".2em", color: soft }}>TUR {round}</span>
        <span style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.45, color: soft, maxWidth: 150 }}>Halka doldukça hediye kahveye yaklaşıyorsun.</span>
      </div>
    </div>
  );
}
