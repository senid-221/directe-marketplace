"use client";
import { useState } from "react";
import Link from "next/link";

type Item={id:string;product:{id:string;name:string;slug:string;price:any;oldPrice:any;stock:number;rating:any;reviewCount:number;images:{url:string}[]}};
export default function WishlistClient({initialItems}:{initialItems:Item[]}){
 const [items,setItems]=useState(initialItems);
 async function remove(productId:string){
  const r=await fetch("/api/wishlist",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId})});
  if(r.ok)setItems(x=>x.filter(i=>i.product.id!==productId));
 }
 return <main className="wishlistPage"><div className="wishlistHeader"><div><div className="eyebrow">SAVED PRODUCTS</div><h1>My Wishlist</h1><p>Keep products you want to come back to.</p></div><Link href="/products" className="secondaryButton">Continue shopping</Link></div>
 {items.length?<div className="wishlistGrid">{items.map(i=><article className="wishlistCard" key={i.id}>
   <Link href={"/product/"+i.product.slug} className="wishlistImage">{i.product.images[0]?<img src={i.product.images[0].url} alt={i.product.name}/>:<span className="material-symbols-outlined">image</span>}</Link>
   <div className="wishlistInfo"><Link href={"/product/"+i.product.slug}><h2>{i.product.name}</h2></Link><div className="wishlistRating"><span className="material-symbols-outlined">star</span> {Number(i.product.rating).toFixed(1)} · {i.product.reviewCount} reviews</div><strong>RWF {Number(i.product.price).toLocaleString()}</strong>{i.product.stock>0?<span className="wishlistStock">In stock</span>:<span className="wishlistOut">Out of stock</span>}<div className="wishlistActions"><Link className="cta" href={"/product/"+i.product.slug}>View product</Link><button onClick={()=>remove(i.product.id)}>Remove</button></div></div>
 </article>)}</div>:<div className="emptyState"><h2>Your wishlist is empty</h2><p>Save products you like while shopping.</p><Link href="/products" className="cta">Browse products</Link></div>}
 </main>;
}
