import * as React from "react";

import { cn } from "@/lib/utils";

export type CountryFlagName = "brazil" | "united-states" | "spain";

export function CountryFlag({
  country,
  className,
}: {
  country: CountryFlagName;
  className?: string;
}): React.ReactElement {
  const sharedProps = {
    "aria-hidden": true as const,
    className: cn("h-3.5 w-5 shrink-0 overflow-hidden rounded-[3px] shadow-sm ring-1 ring-black/10", className),
    focusable: false as const,
  };

  if (country === "brazil") {
    return (
      <svg {...sharedProps} viewBox="0 0 24 16" fill="none">
        <rect width="24" height="16" fill="#009739" />
        <path d="M12 1.25 22.25 8 12 14.75 1.75 8 12 1.25Z" fill="#FFDF00" />
        <circle cx="12" cy="8" r="3.75" fill="#002776" />
        <path d="M8.52 7.45c2.52-1.18 5.92-1.06 9.14.5" stroke="white" strokeWidth=".52" />
      </svg>
    );
  }

  if (country === "united-states") {
    return (
      <svg {...sharedProps} viewBox="0 0 30 20" fill="none">
        <rect width="30" height="20" fill="white" />
        <path d="M0 0h30v1.54H0zM0 3.08h30v1.54H0zM0 6.15h30v1.54H0zM0 9.23h30v1.54H0zM0 12.31h30v1.54H0zM0 15.38h30v1.54H0zM0 18.46h30V20H0z" fill="#B22234" />
        <rect width="12.6" height="10.77" fill="#3C3B6E" />
        <g fill="white">
          <circle cx="1.2" cy="1.15" r=".34" /><circle cx="3.2" cy="1.15" r=".34" /><circle cx="5.2" cy="1.15" r=".34" /><circle cx="7.2" cy="1.15" r=".34" /><circle cx="9.2" cy="1.15" r=".34" /><circle cx="11.2" cy="1.15" r=".34" />
          <circle cx="2.2" cy="2.4" r=".34" /><circle cx="4.2" cy="2.4" r=".34" /><circle cx="6.2" cy="2.4" r=".34" /><circle cx="8.2" cy="2.4" r=".34" /><circle cx="10.2" cy="2.4" r=".34" />
          <circle cx="1.2" cy="3.65" r=".34" /><circle cx="3.2" cy="3.65" r=".34" /><circle cx="5.2" cy="3.65" r=".34" /><circle cx="7.2" cy="3.65" r=".34" /><circle cx="9.2" cy="3.65" r=".34" /><circle cx="11.2" cy="3.65" r=".34" />
          <circle cx="2.2" cy="4.9" r=".34" /><circle cx="4.2" cy="4.9" r=".34" /><circle cx="6.2" cy="4.9" r=".34" /><circle cx="8.2" cy="4.9" r=".34" /><circle cx="10.2" cy="4.9" r=".34" />
          <circle cx="1.2" cy="6.15" r=".34" /><circle cx="3.2" cy="6.15" r=".34" /><circle cx="5.2" cy="6.15" r=".34" /><circle cx="7.2" cy="6.15" r=".34" /><circle cx="9.2" cy="6.15" r=".34" /><circle cx="11.2" cy="6.15" r=".34" />
          <circle cx="2.2" cy="7.4" r=".34" /><circle cx="4.2" cy="7.4" r=".34" /><circle cx="6.2" cy="7.4" r=".34" /><circle cx="8.2" cy="7.4" r=".34" /><circle cx="10.2" cy="7.4" r=".34" />
          <circle cx="1.2" cy="8.65" r=".34" /><circle cx="3.2" cy="8.65" r=".34" /><circle cx="5.2" cy="8.65" r=".34" /><circle cx="7.2" cy="8.65" r=".34" /><circle cx="9.2" cy="8.65" r=".34" /><circle cx="11.2" cy="8.65" r=".34" />
        </g>
      </svg>
    );
  }

  return (
    <svg {...sharedProps} viewBox="0 0 24 16" fill="none">
      <rect width="24" height="16" fill="#AA151B" />
      <rect y="4" width="24" height="8" fill="#F1BF00" />
    </svg>
  );
}
