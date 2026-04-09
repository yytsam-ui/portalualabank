import { LoginForm } from "@/components/auth/login-form";
import { getCurrentSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
