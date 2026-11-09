import { z } from "zod";

/**
 * Structured scent pyramid. The seed data's `pyramid` object maps directly
 * onto this shape: top, heart and base are arrays of note names.
 *
 * The Zod schema is the runtime contract. The TypeScript type is inferred
 * from it, so there is exactly one definition of the shape.
 */
export const pyramidSchema = z.object({
  top: z.array(z.string().min(1)).min(1),
  heart: z.array(z.string().min(1)).min(1),
  base: z.array(z.string().min(1)).min(1),
});

export type Pyramid = z.infer<typeof pyramidSchema>;