import {
  pgTable,
  pgEnum,
  text,
  integer,
  timestamp,
  uuid,
  boolean,
  uniqueIndex,
  index,
  check,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { Pyramid } from "@/lib/pyramid";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
]);

export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull(),
    pyramid: jsonb("pyramid").$type<Pyramid>().notNull(),
    scentFamilyTags: text("scent_family_tags")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    accentHex: text("accent_hex").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    slugUnique: uniqueIndex("products_slug_unique").on(table.slug),
    storeIdx: index("products_store_idx").on(table.storeId),
  }),
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sizeMl: integer("size_ml").notNull(),
    priceKobo: integer("price_kobo").notNull(),
    stock: integer("stock").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    productIdx: index("product_variants_product_idx").on(table.productId),
    sizeCheck: check("size_ml_positive", sql`${table.sizeMl} > 0`),
    priceCheck: check("price_kobo_non_negative", sql`${table.priceKobo} >= 0`),
    stockCheck: check("stock_non_negative", sql`${table.stock} >= 0`),
    uniqueSizePerProduct: uniqueIndex("product_variants_product_size_unique").on(
      table.productId,
      table.sizeMl,
    ),
  }),
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "restrict" }),
    orderNumber: text("order_number").notNull(),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    address: text("address").notNull(),
    note: text("note"),
    status: orderStatusEnum("status").notNull().default("pending"),
    subtotalKobo: integer("subtotal_kobo").notNull(),
    shippingKobo: integer("shipping_kobo").notNull(),
    totalKobo: integer("total_kobo").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    orderNumberUnique: uniqueIndex("orders_order_number_unique").on(
      table.orderNumber,
    ),
    storeIdx: index("orders_store_idx").on(table.storeId),
    statusIdx: index("orders_status_idx").on(table.status),
    createdAtIdx: index("orders_created_at_idx").on(table.createdAt),
    subtotalCheck: check("subtotal_non_negative", sql`${table.subtotalKobo} >= 0`),
    shippingCheck: check("shipping_non_negative", sql`${table.shippingKobo} >= 0`),
    totalCheck: check("total_non_negative", sql`${table.totalKobo} >= 0`),
    totalConsistency: check(
      "total_consistent",
      sql`${table.totalKobo} = ${table.subtotalKobo} + ${table.shippingKobo}`,
    ),
  }),
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict" }),
    productName: text("product_name").notNull(),
    sizeMl: integer("size_ml").notNull(),
    unitPriceKobo: integer("unit_price_kobo").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalKobo: integer("line_total_kobo").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orderIdx: index("order_items_order_idx").on(table.orderId),
    unitPriceCheck: check(
      "unit_price_non_negative",
      sql`${table.unitPriceKobo} >= 0`,
    ),
    quantityCheck: check("quantity_positive", sql`${table.quantity} > 0`),
    lineTotalCheck: check(
      "line_total_non_negative",
      sql`${table.lineTotalKobo} >= 0`,
    ),
    lineTotalConsistency: check(
      "line_total_consistent",
      sql`${table.lineTotalKobo} = ${table.unitPriceKobo} * ${table.quantity}`,
    ),
  }),
);

export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orderIdx: index("order_events_order_idx").on(table.orderId),
    createdAtIdx: index("order_events_created_at_idx").on(table.createdAt),
  }),
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull().default(0),
    resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    resetAtIdx: index("rate_limits_reset_at_idx").on(table.resetAt),
    countCheck: check("rate_limits_count_non_negative", sql`${table.count} >= 0`),
  }),
);