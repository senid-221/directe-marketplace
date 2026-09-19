import Link from "next/link";

const product = {
  name: "Smartphone 128GB",
  price: "RWF 289,000",
  oldPrice: "RWF 349,000",
  rating: "4.8",
  reviews: "128 reviews",
  stock: 24,
  seller: "DIRECTE Electronics",
  description: "A modern smartphone with 128GB storage, sharp display, dependable battery life and dual cameras.",
  images: ["📱","📱","📦","🔋"],
  features: ["128GB storage", "Dual SIM", "Fast charging", "12-month seller warranty"],
};

export default function ProductPage() {
  return (
    <main style={{maxWidth:1280,margin:"0 auto",padding:"30px 20px"}}>
      <Link href="/" style={{color:"var(--directe-orange)",fontWeight:700}}>← Back to shopping</Link>
      <div className="productPage">
        <div>
          <div className="productMainImage">{product.images[0]}</div>
          <div className="productThumbs">{product.images.map((img,i)=><div className="productThumb" key={i}>{img}</div>)}</div>
        </div>
        <section className="productInfo">
          <div className="eyebrow">DIRECTE VERIFIED SELLER</div>
          <h1>{product.name}</h1>
          <div className="productRating">★ {product.rating} · {product.reviews}</div>
          <div className="productPrice">{product.price} <span>{product.oldPrice}</span></div>
          <div className="stock">✓ In stock · {product.stock} available</div>
          <p>{product.description}</p>
          <div className="featureList">{product.features.map(x=><div key={x}>✓ {x}</div>)}</div>
          <div className="sellerBox"><strong>Seller</strong><div>{product.seller}</div><small>Trusted DIRECTE marketplace seller</small></div>
          <div className="quantity"><button>−</button><span>1</span><button>+</button></div>
          <div className="productActions"><button className="cta">Add to cart</button><button className="secondaryButton">Buy now</button></div>
        </section>
      </div>
    </main>
  );
}
