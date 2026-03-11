import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  })

  if (!user?.password) {
    return NextResponse.json({ error: "Aucun mot de passe défini pour ce compte" }, { status: 400 })
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password)
  if (!valid) {
    return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 })
  }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12)
  await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } })

  return NextResponse.json({ ok: true })
}
