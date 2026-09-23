import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BestSellersPage() {
  let products: any[] = [];
  try {
    const sales = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 60,
    });
    const ids = sales.map((s) => s.productId);
    const rows = await prisma.product.findMany({
      where: { id: { in: ids }, published: true, seller: { status: "APPROVED" } },
      include: { images: { orderBy: { position: "asc" } }, seller: true },
    });
    const rank = new Map(ids.map((id, i) => [id, i]));
    products = rows.sort((a, b) => (rank.get(a.id)! - rank.get(b.id)!));
  } catch (error) {
    console.error("AkaziConnect best sellers load failed:", error);
  }

  return (
    <main className="container">
      <Link href="/" style={{color:"var(--akazi-orange)",fontWeight:700}}>← AkaziConnect</Link>
      <div className="sectionHeader"><h1>Best Sellers</h1></div>
      <div className="products">
        {products.map((product) => (
          <article className="card" key={product.id}>
            <Link href={`/product/${product.slug}`}>
              <div className="cardImage">
                {product.images[0] ? <img src={product.images[0].url} alt={product.images[0].alt || product.name} /> : "🛍️"}
              </div>
            </Link>
            <div className="cardBody">
              <Link href={"/product/"+product.slug} className="title">{product.name}</Link>
              <div className="rating">★ {Number(product.rating).toFixed(1)} · {product.seller.storeName}</div>
              <div className="price">RWF {Number(product.price).toLocaleString()}</div>
              <div className="cardFooter"><Link href={`/product/${product.slug}`} className="add" style={{textAlign:"center"}}>View product</Link></div>
            </div>
          </article>
        ))}
      </div>
      {!products.length && <div className="emptyState"><h2>No best sellers yet</h2><p>Best sellers will appear after paid orders are completed.</p></div>}
    </main>
  );
}
