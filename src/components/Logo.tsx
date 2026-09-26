/** Telve logosu: fincan halkası ve telve tanesi. */
export function Logo({ size = 30, color = "#fff", style }: { size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden style={{ display: "block", flex: "none", ...style }}>
      <circle cx="20" cy="20" r="17" stroke={color} strokeWidth="3" />
      <circle cx="20" cy="20" r="10.5" stroke={color} strokeWidth="1" />
      <circle cx="22.5" cy="23.5" r="5" fill={color} />
    </svg>
  );
}
