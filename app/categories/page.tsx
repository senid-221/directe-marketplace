import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const fallbackCategories = [
  { id: "phones", name: "Phones", slug: "phones", count: 0 },
  { id: "computers", name: "Computers", slug: "computers", count: 0 },
  { id: "fashion", name: "Fashion", slug: "fashion", count: 0 },
  { id: "home", name: "Home", slug: "home", count: 0 },
  { id: "beauty", name: "Beauty", slug: "beauty", count: 0 },
  { id: "sports", name: "Sports", slug: "sports", count: 0 },
  { id: "furniture", name: "Furniture", slug: "furniture", count: 0 },
  { id: "electronics", name: "Electronics", slug: "electronics", count: 0 },
];

export default async function CategoriesPage() {
  let categories = fallbackCategories;
  let databaseReady = false;

  try {
    const rows = await prisma.category.findMany({
      where: { parentId: null },
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });

    if (rows.length) {
      databaseReady = true;
      categories = rows.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        count: category._count.products,
      }));
    }
  } catch (error) {
    console.error("DIRECTE categories load failed:", error);
  }

  return (
    <main style={{maxWidth:1280,margin:"0 auto",padding:"30px 20px 60px"}}>
      <Link href="/" style={{color:"var(--directe-orange)",fontWeight:700}}>← Back to DIRECTE</Link>
      <div className="sectionHeader"><h1>All Categories</h1></div>
      {!databaseReady && (
        <div className="databaseNotice">
          Categories are ready. Connect the DIRECTE Neon database and run the Prisma seed to show live product counts.
        </div>
      )}
      <div className="categoryPageGrid">
        {categories.map((category) => (
          <Link href={`/category/${category.slug}`} className="categoryPageCard" key={category.id}>
            <div className="categoryPageIcon">▦</div>
            <div>
              <strong>{category.name}</strong>
              <div className="categoryCount">{category.count > 0 ? `${category.count} products` : "No products yet"}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
