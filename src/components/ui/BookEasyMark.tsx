type BookEasyMarkProps = {
  size?: number;
  className?: string;
  "aria-hidden"?: boolean;
};

export function BookEasyMark({ size = 18, className, "aria-hidden": ariaHidden = true }: BookEasyMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path
        d="M5.25 7.25c0-1.35 1.1-2.45 2.45-2.45h5.1c1.35 0 2.45 1.1 2.45 2.45v4.7c0 1.35-1.1 2.45-2.45 2.45H9.15l-3.4 2.65c-.4.32-1 .03-1-.48V7.25Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="m8.25 9.9 1.65 1.65 3.55-3.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18.25 5.1v3.8M16.35 7h3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18.3 14.45v2.7M16.95 15.8h2.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
