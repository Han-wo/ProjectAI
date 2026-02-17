import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (rawCredentials) => {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const adminEmail = process.env.AUTH_ADMIN_EMAIL ?? "";
        const adminPassword = process.env.AUTH_ADMIN_PASSWORD ?? "";

        if (!adminEmail || !adminPassword) {
          return null;
        }

        if (
          parsed.data.username !== adminEmail ||
          parsed.data.password !== adminPassword
        ) {
          return null;
        }

        return {
          id: "admin-user",
          email: adminEmail,
          name: "Admin"
        };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  }
};
