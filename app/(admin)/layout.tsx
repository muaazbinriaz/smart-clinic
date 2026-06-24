// app/(admin)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Panel | MediBook",
};

export const viewport = {
  themeColor: "#2563EB",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If not logged in, send to login
  if (!session) {
    redirect("/login");
  }

  // If not admin, send to patient dashboard
  if (session.user?.role !== "admin") {
    redirect("/patient/dashboard");
  }

  return <>{children}</>;
}
