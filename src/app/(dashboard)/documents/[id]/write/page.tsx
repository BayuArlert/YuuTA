import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id }, select: { title: true } });
  return { title: doc ? `Menulis: ${doc.title}` : "Editor Penulisan — YuuTA" };
}

export default async function WritePage({ params }: Props) {
  const session = await auth();
  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: { id, userId: session!.user!.id as string },
    include: {
      sections: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!document) notFound();

  // Redirect ke section pertama yang belum selesai, atau section pertama
  const firstIncomplete = document.sections.find((s) => s.status !== "DONE");
  const targetSection = firstIncomplete ?? document.sections[0];

  if (!targetSection) notFound();

  redirect(`/documents/${id}/write/${targetSection.id}`);
}
