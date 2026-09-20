import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import AccountClient from "@/components/AccountClient";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireAuth(["CUSTOMER", "SELLER"]).catch(() => null);
  if (!session) redirect("/login?next=/account");

  const [user, addresses, orders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true, phone: true, createdAt: true },
    }),
    prisma.address.findMany({
      where: { userId: session.userId },
      orderBy: { id: "desc" },
    }),
    prisma.order.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        payment: { select: { status: true, method: true } },
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: {
                  orderBy: { position: "asc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    }),
  ]);

  if (!user) redirect("/login");
  return <AccountClient initialUser={user} initialAddresses={addresses} initialOrders={orders} />;
}
