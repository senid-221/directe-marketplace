"use client";

import { useState } from "react";

type Delivery = {
  trackingCode: string;
  status: string;
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  sector: string;
  address: string;
};

type Order = {
  id: string; total: number; status: string; createdAt: string;
  customer: { name: string | null; email: string | null; phone: string | null };
  delivery: Delivery | null;
  items: { id: string; quantity: number; unitPrice: number; product: { name: string; image: string } }[];
};

const statuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const deliveryStatuses = ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED", "CANCELLED"];

export default function SellerOrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [message, setMessage] = useState("");

  async function updateStatus(orderId: string, status: string) {
    setMessage("");
    const response = await fetch("/api/seller/orders", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, status }),
    });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Could not update order."); return; }
    setOrders((items) => items.map((order) => order.id === orderId ? { ...order, status: data.status } : order));
    setMessage("Order status updated.");
  }

  async function updateDelivery(orderId: string, deliveryStatus: string) {
    setMessage("");
    const response = await fetch("/api/seller/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, deliveryStatus }),
    });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Could not update delivery."); return; }
    setOrders((items) => items.map((order) => order.id === orderId
      ? { ...order, status: data.orderStatus || order.status, delivery: order.delivery ? { ...order.delivery, status: data.deliveryStatus } : order.delivery }
      : order));
    setMessage("Delivery status updated.");
  }

  return <div>{message && <div className="sellerMessage">{message}</div>}
    <div className="sellerOrderCards">{orders.map((order) => <article className="sellerOrderCard" key={order.id}>
      <div className="sellerOrderTop">
        <div><strong>Order #{order.id.slice(-8).toUpperCase()}</strong><small>{new Date(order.createdAt).toLocaleString("en-GB")}</small></div>
        <span className={"statusPill status-" + order.status.toLowerCase()}>{order.status}</span>
      </div>
      <div className="sellerOrderCustomer"><strong>{order.customer.name || "Customer"}</strong><span>{order.customer.phone || order.customer.email || "No contact"}</span></div>
      {order.delivery && <div className="sellerDeliveryBox">
        <div className="sellerDeliveryHead">
          <div><small>RWANDA DELIVERY</small><strong>{order.delivery.trackingCode}</strong></div>
          <span className={"statusPill delivery-" + order.delivery.status.toLowerCase()}>{order.delivery.status.replace("_"," ")}</span>
        </div>
        <div className="sellerDeliveryAddress">
          <strong>{order.delivery.recipientName} · {order.delivery.phone}</strong>
          <span>{order.delivery.province}, {order.delivery.district}, {order.delivery.sector}</span>
          <span>{order.delivery.address}</span>
        </div>
      </div>}
      <div className="sellerOrderItems">{order.items.map((item) => <div key={item.id} className="sellerOrderItem">{item.product.image ? <img src={item.product.image} alt="" /> : <div className="sellerImagePlaceholder"><span className="material-symbols-outlined">image</span></div>}<div><strong>{item.product.name}</strong><small>{item.quantity} × {item.unitPrice.toLocaleString()} FRW</small></div></div>)}</div>
      <div className="sellerOrderBottom">
        <strong>{order.total.toLocaleString()} FRW</strong>
        <div className="sellerOrderControls">
          <label>Order<select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
          {order.delivery && <label>Delivery<select value={order.delivery.status} onChange={(e) => updateDelivery(order.id, e.target.value)}>{deliveryStatuses.map((status) => <option key={status} value={status}>{status.replace("_"," ")}</option>)}</select></label>}
        </div>
      </div>
    </article>)}{!orders.length && <div className="emptyState">No seller orders yet.</div>}</div>
  </div>;
}
