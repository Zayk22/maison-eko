import { config } from "dotenv";

// Side-effect-only module. Import this before any module that reads
// process.env at its top level (notably src/server/db.ts). ES module
// evaluation runs imports in declaration order, so importing this first
// guarantees the variables are loaded before db.ts evaluates.
//
// dotenv's default `override: false` means an already-exported environment
// variable wins over .env.local, which is the correct precedence for CI.
config({ path: ".env.local" });