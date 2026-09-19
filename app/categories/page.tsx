import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  let categories: { id:string; name:string; slug:string; count:number }[] = [];
  let databaseError = false;

  try {
    const rows = await prisma.category.findMany({
      where: { parentId: null },
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
    categories = rows.map((category) => ({ id: category.id, name: category.name, slug: category.slug, count: category._count.products }));
  } catch (error) {
    databaseError = true;
    console.error("DIRECTE categories load failed:", error);
  }

  return (
    <main style={{maxWidth:1280,margin:"0 auto",padding:"30px 20px 60px"}}>
      <Link href="/" style={{color:"var(--directe-orange)",fontWeight:700}}>← Back to DIRECTE</Link>
      <div className="sectionHeader"><h1>All Categories</h1></div>
      {databaseError && (
        <div className="databaseNotice">DIRECTE database is not connected. Set DATABASE_URL on Hostinger and run the Prisma migration and seed.</div>
      )}
      <div className="categoryPageGrid">
        {categories.map((category) => (
          <Link href={`/category/${category.slug}`} className="categoryPageCard" key={category.id}>
            <div className="categoryPageIcon">▦</div>
            <div><strong>{category.name}</strong><div className="categoryCount">{category.count} products</div></div>
          </Link>
        ))}
      </div>
      {!databaseError && categories.length === 0 && (
        <div className="emptyState"><h2>No categories yet</h2><p>Run the DIRECTE Prisma seed after connecting Neon.</p></div>
      )}
    </main>
  );
}
