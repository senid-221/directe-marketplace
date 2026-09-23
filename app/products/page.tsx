import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ sort?: string; min?: string; max?: string }> }) {
  const filters = await searchParams;
  const sort = filters.sort || "newest";
  const min = Number(filters.min || 0);
  const max = Number(filters.max || 0);

  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      where: {
        published: true,
        seller: { status: "APPROVED" },
        ...(min > 0 || max > 0 ? { price: { ...(min > 0 ? { gte: min } : {}), ...(max > 0 ? { lte: max } : {}) } } : {}),
      },
      include: { images: { orderBy: { position: "asc" } }, seller: true },
      orderBy: sort === "price_asc" ? { price: "asc" } : sort === "price_desc" ? { price: "desc" } : { createdAt: "desc" },
      take: 60,
    });
  } catch (error) {
    console.error("AkaziConnect products load failed:", error);
  }

  return (
    <main style={{maxWidth:1280,margin:"0 auto",padding:"30px 20px 60px"}}>
      <Link href="/" style={{color:"var(--akazi-orange)",fontWeight:700}}>← AkaziConnect</Link>
      <div className="sectionHeader">
        <h1>All Products</h1>
        <form className="categoryFilters" method="get">
          <select name="sort" defaultValue={sort}><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select>
          <input name="min" defaultValue={filters.min || ""} placeholder="Min RWF" inputMode="numeric" />
          <input name="max" defaultValue={filters.max || ""} placeholder="Max RWF" inputMode="numeric" />
          <button className="secondaryButton" type="submit">Filter</button>
        </form>
      </div>
      <div className="products">
        {products.map((product) => (
          <article className="card" key={product.id}>
            <Link href={`/product/${product.slug}`}>
              <div className="cardImage">{product.images[0] ? <img src={product.images[0].url} alt={product.images[0].alt || product.name} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : "🛍️"}</div>
            </Link>
            <div className="cardBody">
              <Link href={`/product/${product.slug}`} className="title">{product.name}</Link>
              <div className="rating"><span className="material-symbols-outlined ratingIcon">star</span> {Number(product.rating).toFixed(1)} · {product.seller.storeName}</div>
              <div className="price">RWF {Number(product.price).toLocaleString()}</div>
              <div className="cardFooter"><Link href={`/product/${product.slug}`} className="add" style={{textAlign:"center"}}>View product</Link></div>
            </div>
          </article>
        ))}
      </div>
      {!products.length && <div className="emptyState"><h2>No products found</h2><p>Try changing the price range or sort order.</p></div>}
    </main>
  );
}
