import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user?.role === "admin") {
    redirect("/admin");
  }

  if (session.user?.role !== "patient") {
    redirect("/");
  }

  return <>{children}</>;
}
