import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";

const prisma = new PrismaClient();

const catalog: Array<[string, string, string, number, number]> = [
  ["Phones", "phones", "Smartphone 128GB", 289000, 349000],
  ["Computers", "computers", "Slim Laptop 15.6 inch", 579000, 699000],
  ["Fashion", "fashion", "Unisex Running Shoes", 39000, 52000],
  ["Home", "home", "Home LED Lamp", 12000, 16000],
  ["Beauty", "beauty", "Body Oil 250ml", 15000, 19000],
  ["Sports", "sports", "Football Match Ball", 18000, 24000],
  ["Furniture", "furniture", "Modern Office Chair", 145000, 180000],
  ["Electronics", "electronics", "Wireless Headphones", 24500, 35000]
];

async function main() {
  const sellerUser = await prisma.user.upsert({
    where: { email: "seller@directe.rw" },
    update: { password: hashPassword("change-me-before-production"), role: "SELLER" },
    create: {
      name: "DIRECTE Demo Seller",
      email: "seller@directe.rw",
      role: "SELLER",
      password: hashPassword("change-me-before-production")
    }
  });

  const seller = await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: { status: "APPROVED" },
    create: { userId: sellerUser.id, storeName: "DIRECTE Demo Store", status: "APPROVED" }
  });

  for (const [name, slug, productName, price, oldPrice] of catalog) {
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: { name, slug }
    });

    await prisma.product.upsert({
      where: { slug: productName.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      update: {
        stock: 50,
        published: true,
        price,
        oldPrice,
        categoryId: category.id,
        sellerId: seller.id
      },
      create: {
        sellerId: seller.id,
        categoryId: category.id,
        name: productName,
        slug: productName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: `DIRECTE demo product in ${name}`,
        price,
        oldPrice,
        stock: 50,
        published: true,
        rating: 4.7,
        reviewCount: 25
      }
    });
  }
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(() => prisma.$disconnect());
