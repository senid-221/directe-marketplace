import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  let products: any[] = [];
  try {
    const now = new Date();
    const promotions = await prisma.promotion.findMany({
      where: { active: true, startAt: { lte: now }, endAt: { gt: now } },
      include: {
        products: {
          include: {
            product: {
              include: { images: { orderBy: { position: "asc" } }, seller: true },
            },
          },
        },
      },
      orderBy: { endAt: "asc" },
    });
    const promoted = promotions.flatMap((p) => p.products.map((pp) => ({ product: pp.product, promotion: p })));
    const byId = new Map<string, any>();
    for (const row of promoted) {
      if (row.product.published && row.product.seller.status === "APPROVED") byId.set(row.product.id, row);
    }

    if (byId.size > 0) {
      products = [...byId.values()];
    } else {
      const fallback = await prisma.product.findMany({
        where: { published: true, seller: { status: "APPROVED" }, oldPrice: { not: null } },
        include: { images: { orderBy: { position: "asc" } }, seller: true },
        orderBy: { updatedAt: "desc" },
        take: 60,
      });
      products = fallback
        .filter((p) => Number(p.oldPrice) > Number(p.price))
        .map((product) => ({ product, promotion: null }));
    }
  } catch (error) {
    console.error("AkaziConnect deals load failed:", error);
  }

  return (
    <main className="container">
      <Link href="/" style={{color:"var(--akaziconnect-orange)",fontWeight:700}}>← AkaziConnect</Link>
      <div className="sectionHeader"><h1>Flash Deals</h1></div>
      <div className="products">
        {products.map(({ product, promotion }) => (
          <article className="card" key={product.id}>
            <Link href={"/product/" + product.slug}>
              <div className="cardImage">
                <span className="badge">DEAL</span>
                {product.images[0] ? <img src={product.images[0].url} alt={product.images[0].alt || product.name} /> : "🛍️"}
              </div>
            </Link>
            <div className="cardBody">
              <div className="title">{product.name}</div>
              <div className="rating">★ {Number(product.rating).toFixed(1)} · {product.seller.storeName}</div>
              <div className="price">
                RWF {Number(product.price).toLocaleString()}
                {promotion ? (
                  <span className="old">
                    {promotion.type === "PERCENT"
                      ? Number(promotion.value) + "% off"
                      : promotion.type === "FIXED"
                        ? "Save RWF " + Number(promotion.value).toLocaleString()
                        : "Flash sale"}
                  </span>
                ) : product.oldPrice ? (
                  <span className="old">RWF {Number(product.oldPrice).toLocaleString()}</span>
                ) : null}
              </div>
              <div className="cardFooter"><Link href={"/product/" + product.slug} className="add" style={{textAlign:"center"}}>View deal</Link></div>
            </div>
          </article>
        ))}
      </div>
      {!products.length && <div className="emptyState"><h2>No active deals</h2><p>Active promotion campaigns and discounted products will appear here.</p></div>}
    </main>
  );
}
