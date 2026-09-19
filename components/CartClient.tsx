"use client";
import Link from "next/link";
import { useState } from "react";

type Item={id:string;quantity:number;product:{id:string;name:string;slug:string;price:number;stock:number;seller:string;image:string|null}};
export default function CartClient({initialItems}:{initialItems:Item[]}) {
 const [items,setItems]=useState(initialItems);
 const subtotal=items.reduce((s,i)=>s+i.product.price*i.quantity,0);
 const delivery=items.length?3000:0;
 const total=subtotal+delivery;
 async function update(productId:string,quantity:number){ if(quantity<1)return remove(productId); const r=await fetch("/api/cart",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId,quantity})}); if(r.ok)setItems(xs=>xs.map(i=>i.product.id===productId?{...i,quantity}:i));}
 async function remove(productId:string){await fetch("/api/cart",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId})});setItems(xs=>xs.filter(i=>i.product.id!==productId));}
 if(!items.length)return <div className="emptyState"><h2>Your cart is empty</h2><p>Add products to your cart and they will stay saved in your account.</p><Link href="/products" className="cta">Shop products</Link></div>;
 return <div className="cartLayout"><section>{items.map(i=><article className="cartItem" key={i.id}>
  <Link href={`/product/${i.product.slug}`} className="cartItemImage">{i.product.image?<img src={i.product.image} alt={i.product.name} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:14}}/>:"🛍️"}</Link>
  <div className="cartItemInfo"><Link href={`/product/${i.product.slug}`}><strong>{i.product.name}</strong></Link><div className="cartSeller">{i.product.seller}</div><div className="cartPrice">RWF {(i.product.price*i.quantity).toLocaleString()}</div></div>
  <div className="quantity"><button onClick={()=>update(i.product.id,i.quantity-1)}>−</button><span>{i.quantity}</span><button onClick={()=>update(i.product.id,Math.min(i.quantity+1,i.product.stock))} disabled={i.quantity>=i.product.stock}>+</button></div>
  <button className="remove" onClick={()=>remove(i.product.id)}>Remove</button>
 </article>)}</section>
 <aside className="summary"><h2>Order summary</h2><div><span>Subtotal</span><strong>RWF {subtotal.toLocaleString()}</strong></div><div><span>Delivery</span><strong>RWF {delivery.toLocaleString()}</strong></div><hr/><div className="grand"><span>Total</span><strong>RWF {total.toLocaleString()}</strong></div><Link href="/checkout" className="cta summaryButton">Proceed to checkout</Link></aside></div>;
}
