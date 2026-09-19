const categories = [
  ["📱","Phones"],["💻","Computers"],["👕","Fashion"],["🏠","Home"],
  ["💄","Beauty"],["⚽","Sports"],["🪑","Furniture"],["➕","More"]
];

const products = [
  ["📱","Smartphone 128GB","RWF 289,000","RWF 349,000","4.8","-17%"],
  ["💻","Slim Laptop 15.6 inch","RWF 579,000","RWF 699,000","4.7","-17%"],
  ["👟","Unisex Running Shoes","RWF 39,000","RWF 52,000","4.6","-25%"],
  ["🎧","Wireless Headphones","RWF 24,500","RWF 35,000","4.8","-30%"],
  ["👜","Classic Shoulder Bag","RWF 28,000","RWF 40,000","4.5","-30%"],
  ["⌚","Smart Watch","RWF 32,000","RWF 45,000","4.6","-29%"],
  ["🪑","Modern Office Chair","RWF 145,000","RWF 180,000","4.7","-19%"],
  ["🔌","Power Extension Socket","RWF 9,900","RWF 14,000","4.4","-29%"],
  ["☀️","Solar Panel Kit","RWF 185,000","RWF 230,000","4.6","-20%"],
  ["📺","43-inch Smart TV","RWF 399,000","RWF 470,000","4.8","-15%"]
];

export default function HomePage() {
  return (
    <div className="shell">
      <div className="topbar">Fast delivery across Rwanda · Prices shown in RWF</div>

      <header className="header">
        <div className="headerInner">
          <a href="#" className="brand"><img src="/directe-logo.svg" alt="DIRECTE" className="brandLogo" /></a>

          <label className="search" aria-label="Search products">
            <span>🔍</span>
            <input placeholder="Search products, brands and more..." />
          </label>

          <div className="headerActions">
            <button className="iconButton">♡</button>
            <button className="iconButton">🛒</button>
            <button className="iconButton">Account</button>
          </div>
        </div>
        <nav className="nav">
          <div className="navInner">
            <a href="#">All Categories</a><a href="#">Flash Deals</a><a href="#">New Arrivals</a>
            <a href="#">Best Sellers</a><a href="#">Fashion</a><a href="#">Electronics</a>
            <a href="#">Home & Living</a><a href="#">Become a Seller</a>
          </div>
        </nav>
      </header>

      <main className="container">
        <section className="hero">
          <div className="heroMain">
            <div style={{display:"inline-block",padding:"6px 9px",borderRadius:999,background:"#111",color:"#fff",fontSize:11,fontWeight:800}}>WELCOME TO DIRECTE</div>
            <h1>Everything you need, delivered across Rwanda.</h1>
            <p>Discover products from trusted sellers, compare prices, find deals, and shop from one DIRECTE marketplace.</p>
            <button className="cta">Shop now</button>
          </div>
          <div className="heroSide">
            <div className="promo"><div style={{fontSize:13,fontWeight:800}}>🔥 FLASH DEALS</div><div style={{fontSize:27,fontWeight:800,marginTop:8}}>Up to 50% off</div><div style={{opacity:.75,fontSize:13,marginTop:8}}>Limited-time marketplace offers</div></div>
            <div className="promo"><div style={{fontSize:13,fontWeight:800,color:"var(--directe-orange)"}}>🇷🇼 RWANDA SELLERS</div><div style={{fontSize:23,fontWeight:800,marginTop:8}}>Sell on DIRECTE</div><div style={{opacity:.75,fontSize:13,marginTop:8}}>Build your store and reach customers nationwide.</div></div>
          </div>
        </section>

        <section>
          <div className="sectionHeader"><h2>Shop by category</h2><a href="#">View all</a></div>
          <div className="categories">
            {categories.map(([icon,name]) => <a className="category" href="#" key={name}><div className="categoryIcon">{icon}</div>{name}</a>)}
          </div>
        </section>

        <section className="flash">
          <div className="sectionHeader"><h2>🔥 Flash Deals</h2><a href="#">See all deals</a></div>
          <div className="products">
            {products.slice(0,5).map(([icon,title,price,old,rating,discount]) => (
              <article className="card" key={title}>
                <div className="cardImage"><span className="badge">{discount}</span>{icon}</div>
                <div className="cardBody">
                  <div className="title">{title}</div>
                  <div className="rating">★ {rating} · 100+ sold</div>
                  <div className="price">{price}<span className="old">{old}</span></div>
                  <div className="cardFooter"><button className="add">Add to cart</button><button className="favorite">♡</button></div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="sectionHeader"><h2>Recommended for you</h2><a href="#">View more</a></div>
          <div className="products">
            {products.slice(5).map(([icon,title,price,old,rating,discount]) => (
              <article className="card" key={title}>
                <div className="cardImage"><span className="badge">{discount}</span>{icon}</div>
                <div className="cardBody">
                  <div className="title">{title}</div>
                  <div className="rating">★ {rating} · Popular</div>
                  <div className="price">{price}<span className="old">{old}</span></div>
                  <div className="cardFooter"><button className="add">Add to cart</button><button className="favorite">♡</button></div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footerInner">
          <div><h3>DIRECTE</h3><p>Rwanda-first marketplace connecting customers with trusted sellers and products.</p></div>
          <div><h3>Shop</h3><a href="#">Categories</a><a href="#">Flash Deals</a><a href="#">Best Sellers</a></div>
          <div><h3>Sell</h3><a href="#">Become a Seller</a><a href="#">Seller Center</a><a href="#">Seller Support</a></div>
          <div><h3>Help</h3><a href="#">Orders</a><a href="#">Delivery</a><a href="#">Contact Support</a></div>
        </div>
      </footer>
    </div>
  );
}
