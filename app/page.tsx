import AddToCartButton from "@/components/AddToCartButton";
import Link from "next/link";
import { categoryMedia, productMedia } from "@/lib/product-media";

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

const products = [
  ["smartphone-128gb","Smartphone 128GB","RWF 289,000","RWF 349,000","4.8","-17%"],
  ["slim-laptop-156","Slim Laptop 15.6 inch","RWF 579,000","RWF 699,000","4.7","-17%"],
  ["unisex-running-shoes","Unisex Running Shoes","RWF 39,000","RWF 52,000","4.6","-25%"],
  ["home-led-lamp","Home LED Lamp","RWF 12,000","RWF 16,000","4.5","-25%"],
  ["body-oil-250ml","Body Oil 250ml","RWF 15,000","RWF 19,000","4.6","-21%"],
  ["football-match-ball","Football Match Ball","RWF 18,000","RWF 24,000","4.7","-25%"],
  ["modern-office-chair","Modern Office Chair","RWF 145,000","RWF 180,000","4.7","-19%"],
  ["wireless-headphones","Wireless Headphones","RWF 24,500","RWF 35,000","4.8","-30%"],
];

export default function HomePage() {
  return (
    <div className="shell">
      <div className="topbar">Fast delivery across Rwanda · Prices shown in RWF</div>

      <header className="header">
        <div className="headerInner">
          <a href="/" className="brand"><img src="/directe-logo.svg" alt="DIRECTE" className="brandLogo" /></a>

          <label className="search" aria-label="Search products">
            <span className="material-symbols-outlined">search</span>
            <form action="/search" className="searchForm"><input name="q" placeholder="Search products, brands and more..." /></form>
          </label>

          <div className="headerActions">
            <button className="iconButton" aria-label="Wishlist"><span className="material-symbols-outlined">favorite_border</span></button>
            <button className="iconButton" aria-label="Cart"><span className="material-symbols-outlined">shopping_cart</span></button>
            <button className="iconButton">Account</button>
          </div>
        </div>
        <nav className="nav">
          <div className="navInner">
            <a href="/categories">All Categories</a><a href="/deals">Flash Deals</a><a href="/new-arrivals">New Arrivals</a>
            <a href="/best-sellers">Best Sellers</a><a href="/category/fashion">Fashion</a><a href="/category/electronics">Electronics</a>
            <a href="/category/home">Home & Living</a><a href="/seller/apply">Become a Seller</a>
          </div>
        </nav>
      </header>

      <main className="container">
        <section className="hero">
          <div className="heroMain">
            <div style={{display:"inline-block",padding:"6px 9px",borderRadius:999,background:"#111",color:"#fff",fontSize:11,fontWeight:800}}>WELCOME TO DIRECTE</div>
            <h1>Everything you need, delivered across Rwanda.</h1>
            <p>Discover products from trusted sellers, compare prices, find deals, and shop from one DIRECTE marketplace.</p>
            <Link href="/products" className="cta">Shop now</Link>
          </div>
          <div className="heroSide">
            <div className="promo"><div style={{fontSize:13,fontWeight:800}}><span className="material-symbols-outlined inlineIcon">local_fire_department</span> FLASH DEALS</div><div style={{fontSize:27,fontWeight:800,marginTop:8}}>Up to 50% off</div><div style={{opacity:.75,fontSize:13,marginTop:8}}>Limited-time marketplace offers</div></div>
            <div className="promo"><div style={{fontSize:13,fontWeight:800,color:"var(--directe-orange)"}}>RWANDA SELLERS</div><div style={{fontSize:23,fontWeight:800,marginTop:8}}>Sell on DIRECTE</div><div style={{opacity:.75,fontSize:13,marginTop:8}}>Build your store and reach customers nationwide.</div></div>
          </div>
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
            {products.slice(0,5).map(([slug,title,price,old,rating,discount]) => (
              <article className="card" key={title}>
                <Link href={"/product/"+slug}>
                  <div className="cardImage"><span className="badge">{discount}</span><img src={productMedia[slug]} alt={title} /></div>
                </Link>
                <div className="cardBody">
                  <Link href={"/product/"+slug} className="title">{title}</Link>
                  <div className="rating"><span className="material-symbols-outlined ratingIcon">star</span> {rating} · 100+ sold</div>
                  <div className="price">{price}<span className="old">{old}</span></div>
                  <div className="cardFooter"><AddToCartButton productId={slug} /><Link href={"/product/"+slug} className="favorite" style={{display:"grid",placeItems:"center"}}><span className="material-symbols-outlined">favorite_border</span></Link></div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="sectionHeader"><h2>Recommended for you</h2><a href="/products">View more</a></div>
          <div className="products">
            {products.slice(5).map(([slug,title,price,old,rating,discount]) => (
              <article className="card" key={title}>
                <Link href={"/product/"+slug}>
                  <div className="cardImage"><span className="badge">{discount}</span><img src={productMedia[slug]} alt={title} /></div>
                </Link>
                <div className="cardBody">
                  <Link href={"/product/"+slug} className="title">{title}</Link>
                  <div className="rating"><span className="material-symbols-outlined ratingIcon">star</span> {rating} · Popular</div>
                  <div className="price">{price}<span className="old">{old}</span></div>
                  <div className="cardFooter"><AddToCartButton productId={slug} /><Link href={"/product/"+slug} className="favorite" aria-label="View product"><span className="material-symbols-outlined">arrow_forward</span></Link></div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footerInner">
          <div><h3>DIRECTE</h3><p>Rwanda-first marketplace connecting customers with trusted sellers and products.</p></div>
          <div><h3>Shop</h3><a href="/categories">Categories</a><a href="/deals">Flash Deals</a><a href="/best-sellers">Best Sellers</a></div>
          <div><h3>Sell</h3><a href="/seller/apply">Become a Seller</a><a href="#">Seller Center</a><a href="#">Seller Support</a></div>
          <div><h3>Help</h3><a href="#">Orders</a><a href="#">Delivery</a><a href="#">Contact Support</a></div>
        </div>
      </footer>
    </div>
  );
}
