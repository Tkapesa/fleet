/**
 * White curved separator between Terminal landing sections.
 * Matches terminal-industries.com SeparatorNotch geometry.
 */
export default function TerminalStyleNotch({ className = '' }) {
  return (
    <div className={`relative z-20 -mt-px bg-white ${className}`} aria-hidden="true">
      <svg
        className="block w-full text-white"
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        style={{ height: 'clamp(28px, 3.5vw, 48px)' }}
      >
        <path
          fill="currentColor"
          d="M0,48 L0,18 C120,38 280,8 480,22 C680,36 860,4 1080,20 C1200,28 1320,12 1440,24 L1440,48 Z"
        />
      </svg>
    </div>
  )
}
