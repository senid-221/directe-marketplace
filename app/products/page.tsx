import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      where: { published: true },
      include: { images: { orderBy: { position: "asc" } }, seller: true },
      orderBy: { createdAt: "desc" },
      take: 60,
    });
  } catch (error) {
    console.error("AkaziConnect products load failed:", error);
  }

  return (
    <main style={{maxWidth:1280,margin:"0 auto",padding:"30px 20px 60px"}}>
      <Link href="/" style={{color:"var(--akaziconnect-orange)",fontWeight:700}}>← AkaziConnect</Link>
      <div className="sectionHeader"><h1>All Products</h1></div>
      <div className="products">
        {products.map((product) => (
          <article className="card" key={product.id}>
            <Link href={`/product/${product.slug}`}>
              <div className="cardImage">{product.images[0] ? <img src={product.images[0].url} alt={product.images[0].alt || product.name} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : "🛍️"}</div>
            </Link>
            <div className="cardBody">
              <div className="title">{product.name}</div>
              <div className="rating">★ {Number(product.rating).toFixed(1)} · {product.seller.storeName}</div>
              <div className="price">RWF {Number(product.price).toLocaleString()}</div>
              <div className="cardFooter"><Link href={`/product/${product.slug}`} className="add" style={{textAlign:"center"}}>View product</Link></div>
            </div>
          </article>
        ))}
      </div>
      {!products.length && <div className="emptyState"><h2>No products yet</h2><p>Add products from the Seller Center.</p></div>}
    </main>
  );
}
