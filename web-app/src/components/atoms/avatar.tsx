import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import {
  AvatarCharacter,
  type AvatarPart,
} from "@/components/organisms/avatar-customizer/avatar-character";
import { DEFAULT_AVATAR, type AvatarConfig } from "@/lib/avatar";
import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "inline-flex items-center justify-center rounded-full border-2 border-border bg-card font-bold text-card-foreground select-none shrink-0 shadow-xs",
  {
    variants: {
      size: {
        sm: "h-6 w-6 text-[10px]",
        md: "h-8 w-8 text-xs",
        lg: "h-11 w-11 text-sm",
        xl: "h-14 w-14 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface IAvatarProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof avatarVariants> {
  initials?: string;
  skin?: AvatarConfig["skin"];
  outfit?: AvatarConfig["outfit"];
  headwear?: AvatarConfig["headwear"];
  gender?: AvatarConfig["gender"];
  part?: AvatarPart;
  label?: string;
}

export function Avatar({
  className,
  size,
  initials,
  children,
  skin,
  outfit,
  headwear,
  gender,
  part,
  label,
  ...properties
}: IAvatarProps): React.ReactElement {
  if (skin || outfit || headwear || gender || part) {
    return (
      <div
        className={cn(part === "face" ? "overflow-hidden rounded-full" : "", className)}
        {...properties}
      >
        <AvatarCharacter
          skin={skin ?? DEFAULT_AVATAR.skin}
          outfit={outfit ?? DEFAULT_AVATAR.outfit}
          headwear={headwear ?? DEFAULT_AVATAR.headwear}
          gender={gender ?? DEFAULT_AVATAR.gender}
          part={part}
          label={label}
          className="h-full w-full"
        />
      </div>
    );
  }
  return (
    <div className={cn(avatarVariants({ size }), className)} {...properties}>
      {initials ?? children}
    </div>
  );
}
