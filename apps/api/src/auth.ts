import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import pg from "pg";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://nexu:nexu@localhost:5433/nexu_dev";

const socialProviders: BetterAuthOptions["socialProviders"] = {};

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

const options: BetterAuthOptions = {
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: new pg.Pool({ connectionString: databaseUrl }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders,
  trustedOrigins: [process.env.WEB_URL ?? "http://localhost:5173"],
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
};

export const auth = betterAuth(options);
