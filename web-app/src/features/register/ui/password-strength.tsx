import type { getPasswordStrength } from "../model/register-model";
export function PasswordStrength({
  strength,
}: {
  strength: ReturnType<typeof getPasswordStrength>;
}) {
  return (
    <div className="mt-2.5 flex items-center gap-1.5" aria-live="polite">
      <div className="flex flex-1 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className="h-1.5 flex-1 rounded-full"
            style={{ backgroundColor: step <= strength.score ? strength.color : "#e2e8f0" }}
          />
        ))}
      </div>
      <span className="ml-1.5 text-[11px] font-bold" style={{ color: strength.color }}>
        {strength.label}
      </span>
    </div>
  );
}
