import { redirect } from "next/navigation";
import { CustomerApp } from "@/components/app/CustomerApp";
import { currentUser } from "@/lib/auth";
import { getSummary } from "@/lib/loyalty";

export default async function Home() {
  const user = await currentUser();
  if (user?.role === "kasiyer") redirect("/kasa");
  const summary = user ? await getSummary(user.id) : null;
  return <CustomerApp initial={summary} />;
}
