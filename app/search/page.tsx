import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const products = q.trim()
    ? await prisma.product.findMany({
        where: { published: true, OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } }
        ]},
        include: { images: { orderBy: { position: "asc" } }, seller: true, category: true },
        orderBy: { createdAt: "desc" },
        take: 60
      })
    : [];

  return <main style={{maxWidth:1280,margin:"0 auto",padding:"30px 20px 60px"}}>
    <Link href="/" style={{color:"var(--directe-orange)",fontWeight:700}}>← DIRECTE</Link>
    <div className="sectionHeader"><h1>Search {q ? `results for “${q}”` : "DIRECTE products"}</h1></div>
    <div className="products">
      {products.map(product=><article className="card" key={product.id}>
        <Link href={`/product/${product.slug}`}><div className="cardImage">{product.images[0] ? <img src={product.images[0].url} alt={product.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : "🛍️"}</div></Link>
        <div className="cardBody"><div className="title">{product.name}</div><div className="rating">★ {Number(product.rating).toFixed(1)} · {product.seller.storeName}</div><div className="price">RWF {Number(product.price).toLocaleString()}</div><div className="cardFooter"><Link href={`/product/${product.slug}`} className="add" style={{textAlign:"center"}}>View product</Link></div></div>
      </article>)}
    </div>
    {!products.length && <div className="emptyState"><h2>No matching products</h2><p>Try another product name or category.</p></div>}
  </main>;
}
