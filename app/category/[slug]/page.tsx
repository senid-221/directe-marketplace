import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { productMedia } from "@/lib/product-media";

export const dynamic = "force-dynamic";

type CategoryChild = {
  id: string;
  name: string;
  slug: string;
};

type CategoryProduct = {
  id: string;
  name: string;
  slug: string;
  rating: unknown;
  price: unknown;
  images: Array<{ url: string; alt: string | null }>;
  seller: { storeName: string };
};

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; min?: string; max?: string }>;
}) {
  const { slug } = await params;
  const filters = await searchParams;
  const sort = filters.sort || "newest";
  const min = Number(filters.min || 0);
  const max = Number(filters.max || 0);
  let category = null;

  try {
    category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: true,
        products: {
          where: {
            published: true,
            seller: { status: "APPROVED" },
            ...(min > 0 || max > 0
              ? {
                  price: {
                    ...(min > 0 ? { gte: min } : {}),
                    ...(max > 0 ? { lte: max } : {}),
                  },
                }
              : {}),
          },
          include: {
            images: { orderBy: { position: "asc" } },
            seller: true,
          },
          orderBy:
            sort === "price_asc"
              ? { price: "asc" }
              : sort === "price_desc"
                ? { price: "desc" }
                : { createdAt: "desc" },
          take: 40,
        },
      },
    });
  } catch (error) {
    console.error("AkaziConnect category load failed:", error);
  }

  if (!category) {
    return (
      <main
        className="emptyState"
        style={{ margin: "60px auto", maxWidth: 700 }}
      >
        <h1>Category unavailable</h1>
        <p>
          This category is not available right now. Please return to all
          categories.
        </p>
        <Link href="/categories" className="cta">
          View categories
        </Link>
      </main>
    );
  }

  const children: CategoryChild[] = category.children;
  const products: CategoryProduct[] = category.products;

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "30px 20px 60px" }}>
      <Link
        href="/categories"
        style={{ color: "var(--akazi-orange)", fontWeight: 700 }}
      >
        ← All Categories
      </Link>

      <div className="sectionHeader">
        <h1>{category.name}</h1>
        <form className="categoryFilters" method="get">
          <select name="sort" defaultValue={sort}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
          <input
            name="min"
            defaultValue={filters.min || ""}
            placeholder="Min RWF"
            inputMode="numeric"
          />
          <input
            name="max"
            defaultValue={filters.max || ""}
            placeholder="Max RWF"
            inputMode="numeric"
          />
          <button className="secondaryButton" type="submit">
            Filter
          </button>
        </form>
      </div>

      {children.length > 0 && (
        <div className="subCategoryRow">
          {children.map((sub) => (
            <Link
              key={sub.id}
              href={"/category/" + sub.slug}
              className="subCategoryChip"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      <div className="products">
        {products.map((product) => (
          <article className="card" key={product.id}>
            <Link href={"/product/" + product.slug}>
              <div className="cardImage">
                {product.images[0] ? (
                  <img
                    src={product.images[0].url}
                    alt={product.images[0].alt || product.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <img
                    src={
                      productMedia[product.slug] ||
                      productMedia["wireless-headphones"]
                    }
                    alt={product.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                )}
              </div>
            </Link>

            <div className="cardBody">
              <Link href={"/product/" + product.slug} className="title">
                {product.name}
              </Link>
              <div className="rating">
                <span className="material-symbols-outlined ratingIcon">
                  star
                </span>{" "}
                {Number(product.rating).toFixed(1)} · {product.seller.storeName}
              </div>
              <div className="price">
                RWF {Number(product.price).toLocaleString()}
              </div>
              <div className="cardFooter">
                <Link
                  href={"/product/" + product.slug}
                  className="add"
                  style={{ textAlign: "center" }}
                >
                  View product
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!products.length && (
        <div className="emptyState">
          <h2>No products in this category yet</h2>
          <p>Approved sellers can add products from Seller Center.</p>
        </div>
      )}
    </main>
  );
}
