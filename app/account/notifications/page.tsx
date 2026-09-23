import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import NotificationCenter from "@/components/NotificationCenter";

export default async function NotificationsPage(){
  const session=await requireAuth(["CUSTOMER","SELLER","ADMIN"]).catch(()=>null);
  if(!session) redirect("/login?next=/account/notifications");
  return <main><NotificationCenter/></main>;
}