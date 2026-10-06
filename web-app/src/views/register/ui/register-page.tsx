import { RegisterForm } from "@/features/register";
import { AuthCard } from "@/widgets/auth-layout";

export function RegisterPage() {
  return (
    <AuthCard mode="register">
      <RegisterForm />
    </AuthCard>
  );
}
