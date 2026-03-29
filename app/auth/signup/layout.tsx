import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SignUpLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // If already logged in, redirect to dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
