import { test, expect } from "@playwright/test";
import { Pool } from "@neondatabase/serverless";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const TEST_PHONE_LOCAL = "08012340000";
const TEST_PHONE_CANONICAL = "+2348012340000";
const TEST_NAME = "Playwright Test";
const TEST_STREET = "1 Test Street";
const TEST_AREA = "Ikoyi";
const TEST_STATE = "Lagos";

let createdOrderNumber: string | null = null;

test.afterAll(async () => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run Playwright teardown in production.");
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required.");
  if (/prod/i.test(url)) {
    throw new Error(
      "Refusing to run Playwright teardown against a production database.",
    );
  }
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    // Restore stock for the variants this test ordered.
    await pool.query(
      `
      UPDATE product_variants v
      SET stock = v.stock + s.qty
      FROM (
        SELECT oi.variant_id, SUM(oi.quantity) AS qty
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.phone = $1 AND o.customer_name = $2
        GROUP BY oi.variant_id
      ) s
      WHERE v.id = s.variant_id
      `,
      [TEST_PHONE_CANONICAL, TEST_NAME],
    );

    // Delete the test order (cascades to order_items and order_events).
    await pool.query(
      `DELETE FROM orders WHERE phone = $1 AND customer_name = $2`,
      [TEST_PHONE_CANONICAL, TEST_NAME],
    );

    // Clear rate-limit rows for the keys this test could have touched,
    // so the next run starts clean.
    await pool.query(
      `
      DELETE FROM rate_limits
      WHERE key LIKE 'order:ip:%'
         OR key LIKE 'order:phone:' || $1
         OR key LIKE 'track:order:' || $2
         OR key LIKE 'track:ip:%'
      `,
      [TEST_PHONE_CANONICAL, createdOrderNumber ?? ""],
    );
  } finally {
    await pool.end();
  }
});

test("browse, add to cart, checkout, confirm, track", async ({ page }) => {
  // 1. Browse
  await page.goto("/shop");
  await expect(page.getByRole("heading", { name: "Shop" })).toBeVisible();

  // 2. Open a product
  const firstProduct = page.getByRole("link").filter({ hasText: "From" }).first();
  await firstProduct.click();
  await expect(page).toHaveURL(/\/shop\/.+/);

  // 3. Add to cart (desktop button; the mobile sticky bar is hidden at this viewport)
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(
    page.getByRole("button", { name: "Added to cart" }),
  ).toBeVisible();

  // 4. Open the cart drawer and click Checkout
  await page.getByRole("button", { name: /Open cart/ }).click();
  await page.getByRole("link", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/\/checkout/);

  // 5. Fill the form
  await page.getByLabel("Name").fill(TEST_NAME);
  await page.getByLabel("Phone").fill(TEST_PHONE_LOCAL);
  await page.getByLabel("Street address").fill(TEST_STREET);
  await page.getByLabel("Area or city").fill(TEST_AREA);
  await page.getByLabel("State").fill(TEST_STATE);

  // 6. Submit
  await page.getByRole("button", { name: "Place order" }).click();

  // 7. Confirmation page
  await expect(page).toHaveURL(/\/checkout\/confirmation\/ME-[A-Z0-9]{6}/);
  const url = page.url();
  const match = url.match(/ME-[A-Z0-9]{6}/);
  expect(match).not.toBeNull();
  createdOrderNumber = match![0];
  await expect(page.getByText(createdOrderNumber)).toBeVisible();
  await expect(page.getByText("Bank transfer details")).toBeVisible();

  // 8. Track the order with the same phone
  await page.goto("/track-order");
  await page.getByLabel("Order number").fill(createdOrderNumber);
  await page.getByLabel("Phone number").fill(TEST_PHONE_LOCAL);
  await page.getByRole("button", { name: "Look up order" }).click();

  // Scope to the timeline (ol) to avoid the duplicate "Pending" text
  // in both the header and the first event entry.
  await expect(
    page.locator("ol").getByText("Pending").first(),
  ).toBeVisible();
  await expect(page.getByText(createdOrderNumber).first()).toBeVisible();
});