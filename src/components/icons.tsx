// Tasarımdaki çizgi ikonlar (Lucide tarzı).
type P = { size?: number; color?: string; width?: number };

function Icon({ d, size = 18, color = "currentColor", width = 2 }: P & { d: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export const ArrowRight = (p: P) => <Icon d="M5 12h14M13 6l6 6-6 6" {...p} />;
export const ArrowLeft = (p: P) => <Icon d="M19 12H5M11 6l-6 6 6 6" size={15} width={1.8} {...p} />;
export const Close = (p: P) => <Icon d="M6 6l12 12M18 6L6 18" size={13} width={1.8} {...p} />;
export const Check = (p: P) => <Icon d="M4 12l5 5L20 6" {...p} />;
export const Gift = (p: P) => <Icon d="M4 9h16v11H4zM4 9l2-4h12l2 4M12 5v15" size={20} width={1.9} {...p} />;
export const Scan = (p: P) => <Icon d="M3 7V4h3M18 4h3v3M21 17v3h-3M6 20H3v-3M7 12h10" width={1.9} {...p} />;
export const CardIcon = (p: P) => <Icon d="M3 6h18v12H3zM3 11h18" size={20} width={1.9} {...p} />;
export const Pin = (p: P) => <Icon d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11zM12 10.5v.01" size={20} width={1.9} {...p} />;
export const Person = (p: P) => <Icon d="M4 20c1.5-3.5 4.4-5 8-5s6.5 1.5 8 5M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8" size={20} width={1.9} {...p} />;
export const Minus = (p: P) => <Icon d="M5 12h14" {...p} />;
export const Plus = (p: P) => <Icon d="M12 5v14M5 12h14" {...p} />;
export const Camera = (p: P) => <Icon d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8" {...p} />;
