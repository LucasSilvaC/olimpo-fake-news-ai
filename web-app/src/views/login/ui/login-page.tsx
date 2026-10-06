import { LoginForm } from "@/features/login";
import { AuthCard } from "@/widgets/auth-layout";

export function LoginPage() {
  return (
    <AuthCard mode="login">
      <LoginForm />
    </AuthCard>
  );
}
