import BuyNowButton from "@/components/BuyNowButton";
import AddToCartButton from "@/components/AddToCartButton";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { productMedia } from "@/lib/product-media";
import WishlistButton from "@/components/WishlistButton";
import ReviewsSection from "@/components/ReviewsSection";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, published: true, seller: { status: "APPROVED" } },
    include: { images: { orderBy: { position: "asc" } }, seller: true, category: true, reviews: true, variants: { orderBy: { name: "asc" } } },
  });

  if (!product) {
    return <main className="emptyState" style={{margin:"60px auto",maxWidth:700}}><h1>Product not found</h1><Link href="/" className="cta">Back to shopping</Link></main>;
  }

  return (
    <main style={{maxWidth:1280,margin:"0 auto",padding:"30px 20px"}}>
      <Link href={`/category/${product.category.slug}`} style={{color:"var(--akaziconnect-orange)",fontWeight:700}}><span className="material-symbols-outlined inlineIcon">arrow_back</span> {product.category.name}</Link>
      <div className="productPage">
        <div>
          <div className="productMainImage">
            {product.images[0] ? <img src={product.images[0].url} alt={product.images[0].alt || product.name} style={{width:"100%",height:"100%",objectFit:"contain"}} /> : <img src={productMedia[product.slug] || productMedia["wireless-headphones"]} alt={product.name} style={{width:"100%",height:"100%",objectFit:"contain"}} />}
          </div>
          {product.images.length > 1 && (
            <div className="productThumbs">
              {product.images.map((image: (typeof product.images)[number]) => <div className="productThumb" key={image.id}><img src={image.url} alt={image.alt || product.name} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:12}} /></div>)}
            </div>
          )}
        </div>

        <section className="productInfo">
          <h1>{product.name}</h1>
          <div className="productRating"><span className="material-symbols-outlined ratingIcon">star</span> {Number(product.rating).toFixed(1)} · {product.reviewCount} reviews</div>
          <div className="productPrice">
            RWF {Number(product.price).toLocaleString()}
            {product.oldPrice && <span>RWF {Number(product.oldPrice).toLocaleString()}</span>}
          </div>
          <div className="stock">{product.stock > 0 ? `✓ In stock · ${product.stock} available` : "Out of stock"}</div>{product.variants.length > 0 && <div className="variantPicker"><strong>Options</strong><div>{product.variants.map((variant) => <span key={variant.id} className="subCategoryChip">{variant.name}{variant.price ? ` · RWF ${Number(variant.price).toLocaleString()}` : ""}</span>)}</div></div>}
          <p>{product.description || "Quality product available on AkaziConnect."}</p>
          <div className="featureList">
            <div>✓ Trusted AkaziConnect seller</div>
            <div>✓ Rwanda delivery</div>
            <div>✓ Secure checkout</div>
          </div>
          <div className="sellerBox"><strong>Seller</strong><div>{product.seller.storeName}</div><small>AkaziConnect marketplace seller</small></div>
          <div className="productActions"><button className="secondaryButton" onClick={async () => { await fetch("/api/price-alerts", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ productId: product.id }) }); }}>Notify me on price drop</button>
            {product.stock > 0 ? <AddToCartButton productId={product.id} className="cta">Add to cart</AddToCartButton> : <button className="cta" disabled>Out of stock</button>}
            {product.stock > 0 ? <BuyNowButton productId={product.id} /> : null}
          </div>
        </section>
      </div>

      <section className="productDescriptionPanel">
        <h2>Product details</h2>
        <p>{product.description || "Product details will be provided by the seller."}</p>
      </section>
      <ReviewsSection productId={product.id} />
    </main>
  );
}
