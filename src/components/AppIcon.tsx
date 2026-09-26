/** Ana ekran ikonu: yeşil zemin üzerinde logo. ImageResponse ile PNG'ye çevrilir. */
export function AppIcon({ size }: { size: number }) {
  const logo = Math.round(size * 0.56);
  return (
    <div style={{ width: size, height: size, background: "#182F20", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={logo} height={logo} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="17" stroke="#fff" strokeWidth="3" />
        <circle cx="20" cy="20" r="10.5" stroke="#fff" strokeWidth="1" />
        <circle cx="22.5" cy="23.5" r="5" fill="#fff" />
      </svg>
    </div>
  );
}
