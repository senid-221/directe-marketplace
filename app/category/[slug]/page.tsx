import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let category = null;

  try {
    category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: true,
        products: {
          where: { published: true },
          include: { images: { orderBy: { position: "asc" } }, seller: true },
          orderBy: { createdAt: "desc" },
          take: 40,
        },
      },
    });
  } catch (error) {
    console.error("DIRECTE category load failed:", error);
  }

  if (!category) {
    return (
      <main className="emptyState" style={{margin:"60px auto",maxWidth:700}}>
        <h1>Category unavailable</h1>
        <p>This category is not available right now. Please return to all categories.</p>
        <Link href="/categories" className="cta">View categories</Link>
      </main>
    );
  }

  return (
    <main style={{maxWidth:1280,margin:"0 auto",padding:"30px 20px 60px"}}>
      <Link href="/categories" style={{color:"var(--directe-orange)",fontWeight:700}}>← All Categories</Link>
      <div className="sectionHeader"><h1>{category.name}</h1></div>
      {category.children.length > 0 && (
        <div className="subCategoryRow">
          {category.children.map((sub) => <Link key={sub.id} href={`/category/${sub.slug}`} className="subCategoryChip">{sub.name}</Link>)}
        </div>
      )}
      <div className="products">
        {category.products.map((product) => (
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
      {category.products.length === 0 && (
        <div className="emptyState"><h2>No products in this category yet</h2><p>Approved sellers can add products from Seller Center.</p></div>
      )}
    </main>
  );
}
