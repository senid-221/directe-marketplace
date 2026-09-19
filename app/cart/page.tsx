import Link from "next/link";

const items = [
  {name:"Smartphone 128GB",price:289000,qty:1,icon:"📱"},
  {name:"Wireless Headphones",price:24500,qty:1,icon:"🎧"}
];

export default function CartPage() {
  const subtotal=313500, delivery=3000, total=316500;
  return <main style={{maxWidth:1100,margin:"0 auto",padding:"30px 20px"}}>
    <Link href="/" style={{color:"var(--directe-orange)",fontWeight:700}}>← Continue shopping</Link>
    <div className="sectionHeader"><h1>Shopping Cart</h1></div>
    <div className="cartLayout">
      <section>{items.map(item=><article className="cartItem" key={item.name}>
        <div className="cartItemImage">{item.icon}</div>
        <div className="cartItemInfo"><strong>{item.name}</strong><div className="cartSeller">DIRECTE Electronics</div><div className="cartPrice">RWF {item.price.toLocaleString()}</div></div>
        <div className="quantity"><button>−</button><span>{item.qty}</span><button>+</button></div>
        <button className="remove">Remove</button>
      </article>)}</section>
      <aside className="summary"><h2>Order summary</h2><div><span>Subtotal</span><strong>RWF {subtotal.toLocaleString()}</strong></div><div><span>Delivery</span><strong>RWF {delivery.toLocaleString()}</strong></div><hr/><div className="grand"><span>Total</span><strong>RWF {total.toLocaleString()}</strong></div><Link href="/checkout" className="cta summaryButton">Proceed to checkout</Link></aside>
    </div>
  </main>;
}
