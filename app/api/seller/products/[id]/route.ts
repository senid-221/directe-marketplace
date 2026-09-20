import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

async function getOwnedProduct(userId: string, id: string) {
  return prisma.product.findFirst({
    where: { id, seller: { userId } },
    include: { category: true, images: { orderBy: { position: "asc" } } },
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(["SELLER"]);
  const { id } = await params;
  const current = await getOwnedProduct(session.userId, id);
  if (!current) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  try {
    const body = await request.json();
    const name = String(body.name ?? current.name).trim();
    const description = String(body.description ?? current.description ?? "").trim();
    const categoryId = String(body.categoryId ?? current.categoryId).trim();
    const price = Number(body.price ?? current.price);
    const oldPrice = body.oldPrice === "" || body.oldPrice == null ? null : Number(body.oldPrice);
    const stock = Number(body.stock ?? current.stock);
    const published = body.published === undefined ? current.published : Boolean(body.published);
    const rawImages = Array.isArray(body.images) ? body.images : String(body.images ?? current.images.map((image) => image.url).join("\n")).split(/[,\n]/);
    const images = rawImages.map((url: unknown) => String(url).trim()).filter((url: string) => /^https?:\/\//i.test(url)).slice(0, 8);

    if (!name || !categoryId || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) {
      return NextResponse.json({ error: "Enter valid product details." }, { status: 400 });
    }
    if (!(await prisma.category.findUnique({ where: { id: categoryId } }))) {
      return NextResponse.json({ error: "Category not found." }, { status: 400 });
    }

    let slug = current.slug;
    if (name !== current.name) {
      const baseSlug = slugify(name) || "product";
      slug = baseSlug;
      let suffix = 2;
      while (true) {
        const existing = await prisma.product.findUnique({ where: { slug } });
        if (!existing || existing.id === id) break;
        slug = baseSlug + "-" + suffix++;
      }
    }

    const product = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: id } });
      return tx.product.update({
        where: { id },
        data: {
          name, slug, description: description || null, categoryId, price,
          oldPrice: oldPrice !== null && Number.isFinite(oldPrice) && oldPrice > 0 ? oldPrice : null,
          stock, published,
          images: { create: images.map((url: string, index: number) => ({ url, alt: name, position: index })) },
        },
        include: { category: true, images: { orderBy: { position: "asc" } } },
      });
    });

    return NextResponse.json({
      ok: true,
      product: { ...product, price: Number(product.price), oldPrice: product.oldPrice === null ? null : Number(product.oldPrice) },
    });
  } catch (error) {
    console.error("AkaziConnect seller product update failed:", error);
    return NextResponse.json({ error: "Could not update product." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(["SELLER"]);
  const { id } = await params;
  const current = await getOwnedProduct(session.userId, id);
  if (!current) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  try {
    await prisma.product.update({ where: { id }, data: { published: false } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("AkaziConnect seller product archive failed:", error);
    return NextResponse.json({ error: "Could not archive product." }, { status: 500 });
  }
}
