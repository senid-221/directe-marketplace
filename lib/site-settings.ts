import { prisma } from "@/lib/prisma";

export const DEFAULT_LOGO_URL = "/akaziconnect-logo.svg";

export async function getSiteLogo() {
  const setting = await prisma.siteSetting.findUnique({ where: { id: "default" } });
  return setting?.logoUrl || DEFAULT_LOGO_URL;
}
