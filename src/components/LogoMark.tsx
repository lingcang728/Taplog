export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ color: 'var(--accent)', flexShrink: 0 }}
    >
      <rect x="2.5" y="9" width="2.8" height="6" rx="1.4" fill="currentColor" opacity="0.52" />
      <rect x="6.8" y="5" width="2.8" height="14" rx="1.4" fill="currentColor" opacity="0.82" />
      <rect x="11.1" y="2.5" width="2.8" height="19" rx="1.4" fill="currentColor" />
      <rect x="15.4" y="6.5" width="2.8" height="11" rx="1.4" fill="currentColor" opacity="0.82" />
      <rect x="19.7" y="10" width="2.8" height="4" rx="1.4" fill="currentColor" opacity="0.52" />
    </svg>
  )
}
