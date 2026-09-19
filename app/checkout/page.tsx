export default function CheckoutPage() {
  return <main style={{maxWidth:1100,margin:"0 auto",padding:"30px 20px"}}>
    <div className="sectionHeader"><h1>Checkout</h1></div>
    <div className="checkoutLayout">
      <section className="checkoutCard">
        <h2>Delivery details</h2>
        <div className="formGrid">
          <label>Full name<input placeholder="Your full name"/></label>
          <label>Phone number<input placeholder="+250 7xx xxx xxx"/></label>
          <label>Province<input placeholder="Kigali City"/></label>
          <label>District<input placeholder="Gasabo"/></label>
          <label>Sector<input placeholder="Kacyiru"/></label>
          <label>Address<input placeholder="Street / village / landmark"/></label>
        </div>
        <h2>Payment method</h2>
        <label className="paymentOption"><input type="radio" name="p" defaultChecked/> Mobile Money</label>
        <label className="paymentOption"><input type="radio" name="p"/> Card</label>
        <button className="cta" style={{marginTop:18,width:"100%"}}>Place order · RWF 316,500</button>
      </section>
      <aside className="summary"><h2>Your order</h2><div><span>2 items</span><strong>RWF 313,500</strong></div><div><span>Delivery</span><strong>RWF 3,000</strong></div><hr/><div className="grand"><span>Total</span><strong>RWF 316,500</strong></div></aside>
    </div>
  </main>;
}
