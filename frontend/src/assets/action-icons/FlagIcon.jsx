export default function FlagIcon({ filled = false, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      strokeWidth="0.8"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeLinecap="round"
      {...props}
    >
      <path d="M5.25 21.25V5.25a1.5 1.5 0 0 1 1.5-1.5h11.086a1 1 0 0 1 .821 1.571L15.75 9.5l2.907 4.179a1 1 0 0 1-.82 1.571H5.25" />
    </svg>
  );
}