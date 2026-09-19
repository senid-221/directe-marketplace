import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: true, _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <main style={{maxWidth:1280,margin:"0 auto",padding:"30px 20px 60px"}}>
      <Link href="/" style={{color:"var(--directe-orange)",fontWeight:700}}>← Back to DIRECTE</Link>
      <div className="sectionHeader"><h1>All Categories</h1></div>
      <div className="categoryPageGrid">
        {categories.map((category) => (
          <Link href={`/category/${category.slug}`} className="categoryPageCard" key={category.id}>
            <div className="categoryPageIcon">▦</div>
            <div>
              <strong>{category.name}</strong>
              <div className="categoryCount">{category._count.products} products</div>
            </div>
          </Link>
        ))}
      </div>
      {categories.length === 0 && (
        <div className="emptyState">
          <h2>No categories yet</h2>
          <p>Add categories from the DIRECTE Admin Portal to make them appear here.</p>
        </div>
      )}
    </main>
  );
}
