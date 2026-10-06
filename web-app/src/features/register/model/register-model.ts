export function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: "Informe uma senha", color: "#64748b" };
  const score =
    Number(password.length >= 8) +
    Number(/[a-z]/.test(password) && /[A-Z]/.test(password)) +
    Number(/\d/.test(password)) +
    Number(/[^a-zA-Z0-9]/.test(password));
  return {
    score,
    label: score >= 3 ? "Senha forte" : score >= 2 ? "Senha média" : "Senha fraca",
    color: score >= 3 ? "#047857" : score >= 2 ? "#b45309" : "#b91c1c",
  };
}
