export default function About(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 8h.01" />
      <path strokeLinecap="round" d="M11 12h1v4h1" />
    </svg>
  );
}