import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

// ─── TYPE AUGMENTATION ──────────────────────────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "patient" | "admin" | "doctor";
    } & DefaultSession["user"];
  }
  interface User {
    role: "patient" | "admin" | "doctor";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "patient" | "admin" | "doctor";
  }
}

// ─── AUTH CONFIG ─────────────────────────────────────────────────────────────
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await dbConnect();

        const user = await User.findOne({ email: credentials.email }).lean<{
          _id: { toString(): string };
          name: string;
          email: string;
          password: string;
          role: "patient" | "admin" | "doctor";
        }>();

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (!passwordMatch) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, user object is present — persist role + id into token
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      // Forward id + role from token to session so components can read them
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login", // redirect to login on auth errors
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
});
