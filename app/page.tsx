import { getSiteLogo } from "@/lib/site-settings";
import AddToCartButton from "@/components/AddToCartButton";
import Link from "next/link";
import { categoryMedia } from "@/lib/product-media";
import { prisma } from "@/lib/prisma";

const categoryLinks = [
  ["smartphone", "Phones", "/category/phones", categoryMedia.phones],
  ["computer", "Computers", "/category/computers", categoryMedia.computers],
  ["checkroom", "Fashion", "/category/fashion", categoryMedia.fashion],
  ["home", "Home", "/category/home", categoryMedia.home],
  ["face", "Beauty", "/category/beauty", categoryMedia.beauty],
  ["sports_soccer", "Sports", "/category/sports", categoryMedia.sports],
  ["chair", "Furniture", "/category/furniture", categoryMedia.furniture],
  ["grid_view", "More", "/categories", categoryMedia.electronics],
];



export const dynamic = "force-dynamic";

export default async function HomePage() {
  const logoUrl = await getSiteLogo();
  const businessSetting = await prisma.siteSetting.findUnique({ where: { id: "default" } });
  const businessProfile = (businessSetting?.businessProfile || {}) as { displayName?: string; description?: string; phone?: string; email?: string; website?: string };
  const businessName = businessProfile.displayName || "AkaziConnect";
  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      where: { published: true, seller: { status: "APPROVED" } },
      include: { images: { orderBy: { position: "asc" } }, seller: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch (error) {
    console.error("AkaziConnect homepage products load failed:", error);
  }

  const deals = products.filter((p) => p.oldPrice && Number(p.oldPrice) > Number(p.price)).slice(0, 5);
  const recommended = products.filter((p) => !deals.some((d) => d.id === p.id)).slice(0, 5);
  const quickLinks = [
    { href: "/new-arrivals", icon: "new_releases", label: "New arrivals" },
    { href: "/best-sellers", icon: "trending_up", label: "Best sellers" },
    { href: "/deals", icon: "local_offer", label: "Today's deals" },
    { href: "/seller/apply", icon: "storefront", label: "Sell on AkaziConnect" },
  ];
  return (
    <div className="shell">
      <header className="header">
        <div className="headerInner">
          <a href="/" className="brand"><img src={logoUrl} alt={businessName} className="brandLogo" /></a>

          <form action="/search" method="get" className="search" aria-label="Search products">
            <span className="material-symbols-outlined">search</span>
            <input name="q" placeholder="Search products, brands and more..." autoComplete="off" />
            <button type="submit" className="searchButton" aria-label="Search"><span className="material-symbols-outlined">search</span></button>
          </form>

          <div className="headerActions">
            <Link href="/wishlist" className="iconButton" aria-label="Wishlist"><span className="material-symbols-outlined">favorite_border</span></Link>
            <Link href="/cart" className="iconButton" aria-label="Cart"><span className="material-symbols-outlined">shopping_cart</span></Link>
            <a href="/account" className="iconButton">Account</a>
          </div>
        </div>
        <nav className="nav">
          <div className="navInner">
            <a href="/categories"><span className="material-symbols-outlined inlineIcon">category</span> All Categories</a><a href="/deals"><span className="material-symbols-outlined inlineIcon">local_fire_department</span> Flash Deals</a><a href="/new-arrivals">New Arrivals</a>
            <a href="/best-sellers">Best Sellers</a><a href="/category/fashion">Fashion</a><a href="/category/electronics">Electronics</a>
            <a href="/category/home">Home & Living</a><Link href="/seller/apply" className="sellerNavLink"><span className="material-symbols-outlined inlineIcon">storefront</span> Become a Seller</Link>
          </div>
        </nav>
      </header>

      <main className="container">
        <section className="hero">
          <div className="heroMain">
            <div style={{display:"inline-block",padding:"6px 9px",borderRadius:999,background:"#111",color:"#fff",fontSize:11,fontWeight:800}}>WELCOME TO {businessName}</div>
            <h1>Everything you need, delivered across Rwanda.</h1>
            <p>{businessProfile.description || "Discover products from trusted sellers, compare prices, find deals, and shop from one AkaziConnect marketplace."}</p>
            <Link href="/products" className="cta">Shop now</Link>
          </div>
          <div className="heroSide">
            <div className="promo"><div style={{fontSize:13,fontWeight:800}}><span className="material-symbols-outlined inlineIcon">local_fire_department</span> FLASH DEALS</div><div style={{fontSize:27,fontWeight:800,marginTop:8}}>Up to 50% off</div><div style={{opacity:.75,fontSize:13,marginTop:8}}>Limited-time marketplace offers</div></div>
            <div className="promo"><div style={{fontSize:13,fontWeight:800,color:"var(--akazi-orange)"}}>RWANDA SELLERS</div><div style={{fontSize:23,fontWeight:800,marginTop:8}}>Sell on {businessName}</div><div style={{opacity:.75,fontSize:13,marginTop:8}}>Build your store and reach customers nationwide.</div></div>
          </div>
        </section>

        <section className="quickLinks">
          {quickLinks.map((item) => <Link href={item.href} className="quickLink" key={item.href}><span className="material-symbols-outlined">{item.icon}</span><span>{item.label}</span><span className="material-symbols-outlined arrow">arrow_forward</span></Link>)}
        </section>

        <section>
          <div className="sectionHeader"><h2>Shop by category</h2><a href="/categories">View all</a></div>
          <div className="categories">
            {categoryLinks.map(([icon,name,href,image]) => (
              <Link className="category" href={href} key={name}>
                <div className="categoryIcon"><img src={image} alt="" /></div>
                <span className="material-symbols-outlined categorySymbol">{icon}</span>
                <span>{name}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="flash">
          <div className="sectionHeader"><h2><span className="material-symbols-outlined inlineIcon">local_fire_department</span> Flash Deals</h2><a href="/deals">See all deals</a></div>
          <div className="products">
            {deals.map((product) => (
              <article className="card" key={product.id}>
                <Link href={`/product/${product.slug}`}>
                  <div className="cardImage">
                    <span className="badge">DEAL</span>
                    {product.images[0] ? <img src={product.images[0].url} alt={product.images[0].alt || product.name} /> : "🛍️"}
                  </div>
                </Link>
                <div className="cardBody">
                  <Link href={`/product/${product.slug}`} className="title">{product.name}</Link>
                  <div className="rating"><span className="material-symbols-outlined ratingIcon">star</span> {Number(product.rating).toFixed(1)} · {product.seller.storeName}</div>
                  <div className="price">RWF {Number(product.price).toLocaleString()}<span className="old">RWF {Number(product.oldPrice).toLocaleString()}</span></div>
                  <div className="cardFooter"><AddToCartButton productId={product.id} /><Link href={`/product/${product.slug}`} className="favorite" style={{display:"grid",placeItems:"center"}}><span className="material-symbols-outlined">favorite_border</span></Link></div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="sectionHeader"><h2>Recommended for you</h2><a href="/products">View more</a></div>
          <div className="products">
            {recommended.map((product) => (
              <article className="card" key={product.id}>
                <Link href={`/product/${product.slug}`}>
                  <div className="cardImage">
                    {product.images[0] ? <img src={product.images[0].url} alt={product.images[0].alt || product.name} /> : "🛍️"}
                  </div>
                </Link>
                <div className="cardBody">
                  <Link href={`/product/${product.slug}`} className="title">{product.name}</Link>
                  <div className="rating"><span className="material-symbols-outlined ratingIcon">star</span> {Number(product.rating).toFixed(1)} · {product.seller.storeName}</div>
                  <div className="price">RWF {Number(product.price).toLocaleString()}{product.oldPrice ? <span className="old">RWF {Number(product.oldPrice).toLocaleString()}</span> : null}</div>
                  <div className="cardFooter"><AddToCartButton productId={product.id} /><Link href={`/product/${product.slug}`} className="favorite" aria-label="View product"><span className="material-symbols-outlined">arrow_forward</span></Link></div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footerInner">
          <div><h3>{businessName}</h3><p>{businessProfile.description || "Rwanda-first marketplace connecting customers with trusted sellers and products."}</p>{businessProfile.phone && <p>{businessProfile.phone}</p>}{businessProfile.email && <p>{businessProfile.email}</p>}</div>
          <div><h3>Shop</h3><a href="/categories">Categories</a><a href="/deals">Flash Deals</a><a href="/best-sellers">Best Sellers</a></div>
          <div><h3>Sell</h3><a href="/seller/apply">Become a Seller</a><Link href="/seller">Seller Center</Link><Link href="/seller/support">Seller Support</Link></div>
          <div><h3>Help</h3><Link href="/account?tab=orders">Orders</Link><Link href="/account?tab=orders">Delivery</Link><Link href="/support">Contact Support</Link></div>
        </div>
      </footer>
    </div>
  );
}
