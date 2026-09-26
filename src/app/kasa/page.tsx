import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KasaApp } from "@/components/kasa/KasaApp";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Telve · Kasa" };

export default async function KasaPage() {
  const user = await currentUser();
  if (user?.role !== "kasiyer") redirect("/");
  return <KasaApp cashierName={user.name} />;
}
