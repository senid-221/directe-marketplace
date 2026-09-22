import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SellerStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seller = await prisma.seller.findFirst({
    where: { id, status: "APPROVED" },
    include: {
      products: {
        where: { published: true },
        include: { images: { orderBy: { position: "asc" } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!seller) notFound();

  return (
    <main className="container">
      <Link href="/products" style={{ color: "var(--akaziconnect-orange)", fontWeight: 700 }}>← Shop</Link>
      <section className="sellerStoreHero">
        <div className="sellerStoreAvatar"><span className="material-symbols-outlined">storefront</span></div>
        <div>
          <div className="eyebrow">DIRECTE STORE</div>
          <h1>{seller.storeName}</h1>
          <p>{seller.description || "Trusted marketplace seller on DIRECTE."}</p>
        </div>
      </section>
      <div className="sectionHeader"><h2>Products from this store</h2><span>{seller.products.length} products</span></div>
      <div className="products">
        {seller.products.map((product) => (
          <article className="card" key={product.id}>
            <Link href={`/product/${product.slug}`}>
              <div className="cardImage">
                {product.images[0]
                  ? <img src={product.images[0].url} alt={product.images[0].alt || product.name} />
                  : <span className="material-symbols-outlined">inventory_2</span>}
              </div>
            </Link>
            <div className="cardBody">
              <Link href={`/product/${product.slug}`} className="title">{product.name}</Link>
              <div className="price">RWF {Number(product.price).toLocaleString()}</div>
              <div className="cardFooter"><Link href={`/product/${product.slug}`} className="add">View product</Link></div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
