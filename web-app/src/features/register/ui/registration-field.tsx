import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Input, type IInputProps } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
interface RegistrationFieldProps extends IInputProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  icon: LucideIcon;
  trailing?: ReactNode;
  children?: ReactNode;
}
export function RegistrationField({
  id,
  label,
  hint,
  error,
  icon: Icon,
  trailing,
  children,
  ...props
}: RegistrationFieldProps) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
        <Label htmlFor={id} className="font-bold text-slate-800">
          {label}
          {props.required && (
            <>
              <span aria-hidden="true" className="ml-1 text-red-700">
                *
              </span>
              <span className="sr-only">, obrigatório</span>
            </>
          )}
        </Label>
        {hint && (
          <span id={`${id}-hint`} className="text-xs font-medium text-slate-500">
            {hint}
          </span>
        )}
      </div>
      <div className="relative">
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-500"
        />
        <Input
          {...props}
          id={id}
          variant="registration"
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined
          }
          className={error ? "border-red-600 focus-visible:ring-red-700" : undefined}
        />
        {trailing}
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-sm font-medium text-red-700"
          aria-live="polite"
        >
          {error}
        </p>
      )}
      {children}
    </div>
  );
}
