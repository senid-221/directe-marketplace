import Link from "next/link";

export default function SellerApplyPage() {
  return (
    <main style={{maxWidth:800,margin:"0 auto",padding:"40px 20px 70px"}}>
      <Link href="/" style={{color:"var(--directe-orange)",fontWeight:700}}>← Back to DIRECTE</Link>
      <div className="authCard" style={{marginTop:24,maxWidth:800}}>
        <div className="eyebrow">DIRECTE SELLER PROGRAM</div>
        <h1>Become a Seller</h1>
        <p>Open your store on DIRECTE and reach customers across Rwanda.</p>
        <label>Store name<input placeholder="Your store name"/></label>
        <label>Business description<textarea placeholder="Tell customers about your store" style={{minHeight:110,border:"1px solid var(--directe-border)",borderRadius:10,padding:13,font: "inherit"}} /></label>
        <label>Phone number<input placeholder="+250 7xx xxx xxx"/></label>
        <label>Email<input type="email" placeholder="store@example.com"/></label>
        <button className="cta" style={{width:"100%"}}>Submit seller application</button>
        <small>Your application will be reviewed by the DIRECTE team before your store is approved.</small>
      </div>
    </main>
  );
}
