import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userName = session?.user?.name || session?.user?.email || "Mode test";
  const firstName = session?.user?.name?.split(" ")[0] ?? userName;
  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : (session?.user?.email?.[0] ?? "T").toUpperCase();

  return (
    <DashboardShell
      userName={userName}
      firstName={firstName}
      initials={initials}
      email={session.user?.email ?? ""}
    >
      {children}
    </DashboardShell>
  );
}
