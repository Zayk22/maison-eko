/**
 * Normalise a Nigerian phone number to +234xxxxxxxxxx.
 * Throws on invalid length or an unrecognised mobile prefix.
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  let localDigits = "";

  if (digits.length === 11 && digits.startsWith("0")) {
    localDigits = digits.slice(1);
  } else if (digits.length === 13 && digits.startsWith("234")) {
    localDigits = digits.slice(3);
  } else if (digits.length === 10) {
    localDigits = digits;
  } else {
    throw new Error("Invalid Nigerian phone number length.");
  }

  if (!/^[789][01]\d{8}$/.test(localDigits)) {
    throw new Error("Invalid Nigerian phone number prefix.");
  }

  return `+234${localDigits}`;
}