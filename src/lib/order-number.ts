import { randomInt } from "node:crypto";

/**
 * Unambiguous alphabet: 0, O, 1 and I are excluded so a number can be read
 * aloud without confusion. 32 characters, six of them per order: about
 * 1.07 billion combinations.
 */
export const ORDER_NUMBER_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const ORDER_NUMBER_LENGTH = 6;
export const ORDER_NUMBER_PREFIX = "ME-";

/**
 * Generate a new order number. Uses crypto.randomInt, not Math.random.
 * Uniqueness is enforced by a UNIQUE constraint in the database; a
 * collision on insert triggers a whole-transaction retry (see Batch 5).
 */
export function generateOrderNumber(): string {
  let code = "";
  for (let i = 0; i < ORDER_NUMBER_LENGTH; i++) {
    code += ORDER_NUMBER_ALPHABET[randomInt(0, ORDER_NUMBER_ALPHABET.length)];
  }
  return ORDER_NUMBER_PREFIX + code;
}

/**
 * Format-only validation. This is NOT authorisation: viewing an order
 * requires the correct phone number for that order number (Batch 5).
 */
export function isValidOrderNumber(input: string): boolean {
  if (!input.startsWith(ORDER_NUMBER_PREFIX)) return false;
  const code = input.slice(ORDER_NUMBER_PREFIX.length);
  if (code.length !== ORDER_NUMBER_LENGTH) return false;
  for (const ch of code) {
    if (!ORDER_NUMBER_ALPHABET.includes(ch)) return false;
  }
  return true;
}