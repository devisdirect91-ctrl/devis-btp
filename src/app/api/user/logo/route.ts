import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin, STORAGE_BUCKETS, getPublicUrl } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 })

  const maxSize = 2 * 1024 * 1024 // 2MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 2 Mo)" }, { status: 400 })
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"]
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Format non supporté (JPG, PNG, WebP, SVG)" }, { status: 400 })
  }

  const ext = file.name.split(".").pop() ?? "png"
  const path = `${session.user.id}/logo.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKETS.LOGOS)
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (error) {
    return NextResponse.json({ error: "Erreur lors de l'upload: " + error.message }, { status: 500 })
  }

  const url = getPublicUrl(STORAGE_BUCKETS.LOGOS, path)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { companyLogo: url },
  })

  return NextResponse.json({ ok: true, url })
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  await prisma.user.update({
    where: { id: session.user.id },
    data: { companyLogo: null },
  })

  return NextResponse.json({ ok: true })
}
