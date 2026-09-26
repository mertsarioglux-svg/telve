import type { Metadata } from "next";
import { ResetPassword } from "@/components/auth/ResetPassword";

export const metadata: Metadata = { title: "Telve · Şifre yenile" };

export default async function Page({ searchParams }: PageProps<"/sifre-yenile">) {
  const { token } = await searchParams;
  return <ResetPassword token={typeof token === "string" ? token : ""} />;
}
