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
  ["grid_view", "More", "/categories", categoryMedia.electronics]
];

const products = [
  ["smartphone-128gb","Smartphone 128GB","RWF 289,000","RWF 349,000","4.8","-17%"],
  ["slim-laptop-156","Slim Laptop 15.6 inch","RWF 579,000","RWF 699,000","4.7","-17%"],
  ["unisex-running-shoes","Unisex Running Shoes","RWF 39,000","RWF 52,000","4.6","-25%"],
  ["home-led-lamp","Home LED Lamp","RWF 12,000","RWF 16,000","4.5","-25%"],
  ["body-oil-250ml","Body Oil 250ml","RWF 15,000","RWF 19,000","4.6","-21%"],
  ["football-match-ball","Football Match Ball","RWF 18,000","RWF 24,000","4.7","-25%"],
  ["modern-office-chair","Modern Office Chair","RWF 145,000","RWF 180,000","4.7","-19%"],
  ["wireless-headphones","Wireless Headphones","RWF 24,500","RWF 35,000","4.8","-30%"]
];
