import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CatalogueView } from "@/components/catalogue/catalogue-view"

export const metadata = { title: "Catalogue — BTPoche" }

export default async function CataloguePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const items = await prisma.catalogItem.findMany({
    where: { userId: session.user.id },
    orderBy: [{ category: "asc" }, { designation: "asc" }],
  })

  return <CatalogueView items={items} />
}
