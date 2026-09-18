import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={{ name: session.user?.name ?? "", email: session.user?.email ?? "", image: session.user?.image ?? undefined }} />
      <main className="flex-1 p-6 sm:p-8 md:p-10 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
