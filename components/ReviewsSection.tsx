"use client";
import { useEffect, useState } from "react";

type Review={id:string;rating:number;comment:string|null;createdAt:string;user:{name:string|null}};
export default function ReviewsSection({productId}:{productId:string}) {
  const [reviews,setReviews]=useState<Review[]>([]);
  const [rating,setRating]=useState(5);
  const [comment,setComment]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(true);

  async function load() {
    const r=await fetch("/api/reviews?productId="+encodeURIComponent(productId),{cache:"no-store"});
    const d=await r.json();
    if(r.ok) setReviews(d.reviews||[]);
    setLoading(false);
  }
  useEffect(()=>{load()},[productId]);

  async function submit(e:React.FormEvent) {
    e.preventDefault(); setMessage("");
    const r=await fetch("/api/reviews",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId,rating,comment})});
    const d=await r.json();
    if(!r.ok){setMessage(d.error||"Could not submit review.");return;}
    setMessage("Review saved.");
    setComment("");
    await load();
  }

  return <section className="reviewsSection">
    <div className="reviewsHeader"><div><h2>Customer reviews</h2><p>{reviews.length} review{reviews.length===1?"":"s"}</p></div></div>
    <div className="reviewGrid">
      <form className="reviewForm" onSubmit={submit}>
        <h3>Write a review</h3>
        <p className="reviewHint">Reviews are available after a delivered order.</p>
        <div className="reviewStars" role="radiogroup" aria-label="Rating">
          {[1,2,3,4,5].map(n=><button type="button" key={n} className={n<=rating?"active":""} onClick={()=>setRating(n)} aria-label={n+" stars"}><span className="material-symbols-outlined">{n<=rating?"star":"star_border"}</span></button>)}
        </div>
        <textarea value={comment} onChange={e=>setComment(e.target.value)} maxLength={1000} placeholder="Share your experience..." />
        {message&&<div className="reviewMessage">{message}</div>}
        <button className="cta" type="submit">Submit review</button>
      </form>
      <div className="reviewList">
        {loading&&<p>Loading reviews...</p>}
        {!loading&&!reviews.length&&<div className="emptyState">No reviews yet.</div>}
        {reviews.map(r=><article className="reviewCard" key={r.id}>
          <div className="reviewTop"><strong>{r.user.name||"Customer"}</strong><span>{new Date(r.createdAt).toLocaleDateString()}</span></div>
          <div className="reviewStars">{[1,2,3,4,5].map(n=><span key={n} className={n<=r.rating?"active":""}><span className="material-symbols-outlined">star</span></span>)}</div>
          {r.comment&&<p>{r.comment}</p>}
        </article>)}
      </div>
    </div>
  </section>;
}
