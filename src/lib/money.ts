export const FLAT_SHIPPING_KOBO = 350000;

/**
 * Format an integer number of kobo as Nigerian Naira.
 * Throws if the input is not an integer, so a float can never be formatted.
 *
 * Whole naira amounts are shown without decimals (NGN 32,000, not NGN
 * 32,000.00). Two decimals are shown only when kobo is non-zero.
 */
export function formatMoney(kobo: number): string {
  if (!Number.isInteger(kobo)) {
    throw new Error("Money must be an integer number of kobo.");
  }
  const naira = kobo / 100;
  const hasKobo = kobo % 100 !== 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: hasKobo ? 2 : 0,
    maximumFractionDigits: hasKobo ? 2 : 0,
  }).format(naira);
}

/**
 * Parse a user-entered decimal string into an integer number of kobo.
 * No floats are used at any stage.
 */
export function parseMoneyToKobo(input: string): number {
  const cleaned = input.replace(/[₦NGNngn\s,]/g, "");
  if (!/^\d*(\.\d{0,2})?$/.test(cleaned)) {
    throw new Error("Invalid money format.");
  }
  if (cleaned === "" || cleaned === ".") return 0;

  const parts = cleaned.split(".");
  const nairaStr = parts[0] || "0";
  let koboStr = parts[1] || "";
  if (koboStr.length === 1) koboStr += "0";
  if (koboStr.length === 0) koboStr = "00";

  const naira = parseInt(nairaStr, 10);
  const kobo = parseInt(koboStr, 10);

  if (!Number.isSafeInteger(naira * 100 + kobo)) {
    throw new Error("Amount exceeds safe integer limits.");
  }

  return naira * 100 + kobo;
}