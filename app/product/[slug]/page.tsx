import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { images: { orderBy: { position: "asc" } }, seller: true, category: true, reviews: true },
  });

  if (!product) {
    return <main className="emptyState" style={{margin:"60px auto",maxWidth:700}}><h1>Product not found</h1><Link href="/" className="cta">Back to shopping</Link></main>;
  }

  return (
    <main style={{maxWidth:1280,margin:"0 auto",padding:"30px 20px"}}>
      <Link href={`/category/${product.category.slug}`} style={{color:"var(--directe-orange)",fontWeight:700}}>← {product.category.name}</Link>
      <div className="productPage">
        <div>
          <div className="productMainImage">
            {product.images[0] ? <img src={product.images[0].url} alt={product.images[0].alt || product.name} style={{width:"100%",height:"100%",objectFit:"contain"}} /> : "🛍️"}
          </div>
          {product.images.length > 1 && (
            <div className="productThumbs">
              {product.images.map((image)=> <div className="productThumb" key={image.id}><img src={image.url} alt={image.alt || product.name} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:12}} /></div>)}
            </div>
          )}
        </div>

        <section className="productInfo">
          <div className="eyebrow">DIRECTE MARKETPLACE</div>
          <h1>{product.name}</h1>
          <div className="productRating">★ {Number(product.rating).toFixed(1)} · {product.reviewCount} reviews</div>
          <div className="productPrice">
            RWF {Number(product.price).toLocaleString()}
            {product.oldPrice && <span>RWF {Number(product.oldPrice).toLocaleString()}</span>}
          </div>
          <div className="stock">{product.stock > 0 ? `✓ In stock · ${product.stock} available` : "Out of stock"}</div>
          <p>{product.description || "Quality product available on DIRECTE."}</p>
          <div className="featureList">
            <div>✓ Trusted DIRECTE seller</div>
            <div>✓ Rwanda delivery</div>
            <div>✓ Secure checkout</div>
          </div>
          <div className="sellerBox"><strong>Seller</strong><div>{product.seller.storeName}</div><small>DIRECTE marketplace seller</small></div>
          <div className="productActions">
            <Link href={product.stock > 0 ? `/cart?add=${product.slug}` : "#"} className="cta">Add to cart</Link>
            <Link href={product.stock > 0 ? `/checkout?product=${product.slug}` : "#"} className="secondaryButton">Buy now</Link>
          </div>
        </section>
      </div>

      <section className="productDescriptionPanel">
        <h2>Product details</h2>
        <p>{product.description || "Product details will be provided by the seller."}</p>
      </section>
    </main>
  );
}
