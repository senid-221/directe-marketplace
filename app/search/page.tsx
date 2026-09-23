import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string; min?: string; max?: string }> }) {
  const { q = "", sort = "newest", min: minParam = "", max: maxParam = "" } = await searchParams;
  const min = Number(minParam || 0);
  const max = Number(maxParam || 0);
  const term = q.trim();
  const products = term
    ? await prisma.product.findMany({
        where: { published: true, seller: { status: "APPROVED" }, ...(min > 0 || max > 0 ? { price: { ...(min > 0 ? { gte: min } : {}), ...(max > 0 ? { lte: max } : {}) } } : {}), OR: [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { slug: { contains: term.toLowerCase(), mode: "insensitive" } },
          { category: { name: { contains: term, mode: "insensitive" } } },
          { seller: { storeName: { contains: term, mode: "insensitive" } } }
        ]},
        include: { images: { orderBy: { position: "asc" } }, seller: true, category: true },
        orderBy: sort === "price_asc" ? { price: "asc" } : sort === "price_desc" ? { price: "desc" } : { createdAt: "desc" },
        take: 60
      })
    : [];

  return <main style={{maxWidth:1280,margin:"0 auto",padding:"30px 20px 60px"}}>
    <Link href="/" style={{color:"var(--akaziconnect-orange)",fontWeight:700}}>← AkaziConnect</Link>
    <form action="/search" method="get" className="search" style={{maxWidth:760,margin:"18px 0"}}>
      <span className="material-symbols-outlined">search</span>
      <input name="q" defaultValue={q} placeholder="Search products, brands, categories or sellers..." autoComplete="off" />
      <button type="submit" className="searchButton" aria-label="Search"><span className="material-symbols-outlined">search</span></button>
    </form>
    <div className="sectionHeader"><h1>{q ? `Search results for “${q}”` : "Search AkaziConnect"}</h1><form className="categoryFilters" method="get"><input type="hidden" name="q" value={q}/><select name="sort" defaultValue={sort}><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select><input name="min" defaultValue={minParam} placeholder="Min RWF" inputMode="numeric"/><input name="max" defaultValue={maxParam} placeholder="Max RWF" inputMode="numeric"/><button className="secondaryButton" type="submit">Filter</button></form></div>
    <div className="products">
      {products.map((product: (typeof products)[number]) => <article className="card" key={product.id}>
        <Link href={`/product/${product.slug}`}><div className="cardImage">{product.images[0] ? <img src={product.images[0].url} alt={product.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : "🛍️"}</div></Link>
        <div className="cardBody"><Link href={`/product/${product.slug}`} className="title">{product.name}</Link><div className="rating"><span className="material-symbols-outlined ratingIcon">star</span> {Number(product.rating).toFixed(1)} · {product.seller.storeName}</div><div className="price">RWF {Number(product.price).toLocaleString()}</div><div className="cardFooter"><Link href={`/product/${product.slug}`} className="add" style={{textAlign:"center"}}>View product</Link></div></div>
      </article>)}
    </div>
    {!products.length && <div className="emptyState"><h2>No matching products</h2><p>Try another product name, category, or price range.</p></div>}
  </main>;
}
