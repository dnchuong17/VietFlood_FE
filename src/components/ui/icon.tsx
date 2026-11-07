import type { SVGProps } from "react";

const paths = {
  waves: "M2 6c2-3 4 3 6 0s4 3 6 0 4 3 8 0M2 12c2-3 4 3 6 0s4 3 6 0 4 3 8 0M2 18c2-3 4 3 6 0s4 3 6 0 4 3 8 0",
  home: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87",
  login: "M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M13 8l4 4-4 4M8 12h13",
  logout: "M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M17 8l4 4-4 4M9 12h12",
  chevron: "m6 9 6 6 6-6",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  layers: "m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5",
  sliders: "M4 4v5m0 4v7M12 4v9m0 4v3M20 4v1m0 4v11M1 9h6m2 8h6m2-12h6",
  rain: "M16 13h2a4 4 0 0 0 0-8 6 6 0 0 0-11-1 4 4 0 0 0-1 8h1M8 16l-1 4m6-4-1 4m6-4-1 4",
  wind: "M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h5a2 2 0 1 1-2 2",
  temp: "M9 14V5a3 3 0 0 1 6 0v9a5 5 0 1 1-6 0ZM12 8v10",
  rh: "M12 3S5 10 5 15a7 7 0 0 0 14 0c0-5-7-12-7-12Zm-3 13a3 3 0 0 0 3 3",
  clouds: "M7 18h11a4 4 0 0 0 .6-7.95 6 6 0 0 0-11.4-2A5 5 0 0 0 7 18Z",
  pressure: "M4 19a10 10 0 1 1 16 0M12 14l5-6M5 12h1m1-6 1 1m4-3v1m6 7h1",
  check: "m5 12 4 4L19 6",
  eye: "M2 12s3.8-6 10-6 10 6 10 6-3.8 6-10 6-10-6-10-6Z",
  eyeOff: "m3 3 18 18M10.6 6.1c.5-.1.9-.1 1.4-.1 6.2 0 10 6 10 6a18 18 0 0 1-4.2 4.4M6.2 8.1A18.9 18.9 0 0 0 2 12s3.8 6 10 6c.5 0 1 0 1.4-.1M9.9 9.9a3 3 0 0 0 4.2 4.2",
  lock: "M6 10V7a6 6 0 0 1 12 0v3M5 10h14v11H5V10Zm7 5v2",
  user: "M20 21v-2a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v2",
  alert: "m12 3 10 18H2L12 3Zm0 6v4m0 4h.01",
  spinner: "M21 12a9 9 0 1 1-6-8.5",
  shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6",
} satisfies Record<string, string>;

export type IconName = keyof typeof paths;
type IconProps = Omit<SVGProps<SVGSVGElement>, "name"> & { name: IconName; size?: "sm" | "md" | "lg" };

/** Decorative by default; name the containing control, not its glyph. */
export function Icon({ name, size = "md", className = "", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={`ui-icon ui-icon-${size} ${className}`} {...props}>
      <path d={paths[name]} />
      {name === "eye" ? <circle cx="12" cy="12" r="3" /> : null}
      {name === "user" || name === "users" ? <circle cx={name === "users" ? 9 : 12} cy="6" r="4" /> : null}
    </svg>
  );
}
