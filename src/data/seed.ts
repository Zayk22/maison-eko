import "./load-env";
import { and, eq } from "drizzle-orm";
import { db } from "../server/db";
import { stores, products, productVariants } from "../server/schema";
import { SEED_FRAGRANCES } from "./seed-data";
import { pyramidSchema } from "../lib/pyramid";

type Summary = {
  storeInserted: number;
  storeSkipped: number;
  productsInserted: number;
  productsUpdated: number;
  variantsInserted: number;
  variantsUpdated: number;
};

async function run(): Promise<void> {
  const summary: Summary = {
    storeInserted: 0,
    storeSkipped: 0,
    productsInserted: 0,
    productsUpdated: 0,
    variantsInserted: 0,
    variantsUpdated: 0,
  };

  await db.transaction(async (tx) => {
    const existingStore = (
      await tx.select({ id: stores.id }).from(stores).limit(1)
    ).at(0);

    let storeId: string;
    if (existingStore === undefined) {
      const [inserted] = await tx
        .insert(stores)
        .values({ name: "Maison Eko" })
        .returning({ id: stores.id });
      storeId = inserted!.id;
      summary.storeInserted = 1;
    } else {
      storeId = existingStore.id;
      summary.storeSkipped = 1;
    }

    for (const fragrance of SEED_FRAGRANCES) {
      const validatedPyramid = pyramidSchema.parse(fragrance.pyramid);

      const existingProduct = (
        await tx
          .select({ id: products.id })
          .from(products)
          .where(eq(products.slug, fragrance.slug))
          .limit(1)
      ).at(0);

      let productId: string;
      if (existingProduct === undefined) {
        const [inserted] = await tx
          .insert(products)
          .values({
            storeId,
            name: fragrance.name,
            slug: fragrance.slug,
            description: fragrance.description,
            pyramid: validatedPyramid,
            scentFamilyTags: [...fragrance.tags],
            accentHex: fragrance.accentHex,
            active: fragrance.active,
          })
          .returning({ id: products.id });
        productId = inserted!.id;
        summary.productsInserted += 1;
      } else {
        await tx
          .update(products)
          .set({
            name: fragrance.name,
            description: fragrance.description,
            pyramid: validatedPyramid,
            scentFamilyTags: [...fragrance.tags],
            accentHex: fragrance.accentHex,
          })
          .where(eq(products.id, existingProduct.id));
        productId = existingProduct.id;
        summary.productsUpdated += 1;
      }

      for (const variant of fragrance.variants) {
        const existingVariant = (
          await tx
            .select({ id: productVariants.id })
            .from(productVariants)
            .where(
              and(
                eq(productVariants.productId, productId),
                eq(productVariants.sizeMl, variant.sizeMl),
              ),
            )
            .limit(1)
        ).at(0);

        if (existingVariant === undefined) {
          await tx.insert(productVariants).values({
            productId,
            sizeMl: variant.sizeMl,
            priceKobo: variant.priceKobo,
            stock: variant.stock,
          });
          summary.variantsInserted += 1;
        } else {
          await tx
            .update(productVariants)
            .set({ priceKobo: variant.priceKobo })
            .where(eq(productVariants.id, existingVariant.id));
          summary.variantsUpdated += 1;
        }
      }
    }
  });

  console.log("");
  console.log("Seed summary");
  console.log(`  stores   inserted ${summary.storeInserted}  skipped ${summary.storeSkipped}`);
  console.log(`  products inserted ${summary.productsInserted}  updated ${summary.productsUpdated}`);
  console.log(`  variants inserted ${summary.variantsInserted}  updated ${summary.variantsUpdated}`);
  console.log("");
}

run()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });