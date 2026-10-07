import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({
  children,
  className,
  ...properties
}: React.ComponentProps<typeof SelectPrimitive.Trigger>): React.ReactElement {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "inline-flex h-10 w-[118px] items-center justify-between gap-2 rounded-xl border border-amber-300/90 bg-white/10 px-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-950/15 backdrop-blur-md transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 data-[popup-open]:bg-white/15 sm:w-[136px] sm:px-3 sm:text-sm",
        className,
      )}
      {...properties}
    >
      {children}
      <SelectPrimitive.Icon className="grid size-4 shrink-0 place-items-center text-white/80">
        <ChevronDown aria-hidden="true" className="size-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  align = "end",
  children,
  className,
  sideOffset = 6,
  ...properties
}: React.ComponentProps<typeof SelectPrimitive.Positioner>): React.ReactElement {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        align={align}
        alignItemWithTrigger={false}
        className="z-50"
        sideOffset={sideOffset}
        {...properties}
      >
        <SelectPrimitive.Popup
          className={cn(
            "min-w-40 overflow-hidden rounded-xl border border-blue-950/10 bg-white p-1.5 text-slate-800 shadow-2xl shadow-blue-950/25 outline-none",
            className,
          )}
        >
          <SelectPrimitive.List className="max-h-64 overflow-y-auto">
            {children}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  children,
  className,
  ...properties
}: React.ComponentProps<typeof SelectPrimitive.Item>): React.ReactElement {
  return (
    <SelectPrimitive.Item
      className={cn(
        "flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium outline-none transition-colors data-[highlighted]:bg-blue-600 data-[highlighted]:text-white data-[selected]:bg-blue-50 data-[selected]:text-blue-700 data-[selected]:data-[highlighted]:bg-blue-600 data-[selected]:data-[highlighted]:text-white",
        className,
      )}
      {...properties}
    >
      <SelectPrimitive.ItemText className="flex min-w-0 flex-1 items-center gap-2.5">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="ml-auto grid size-4 shrink-0 place-items-center">
        <Check aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
