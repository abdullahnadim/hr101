import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isPasswordValid) return null;

        return {
          id: user.id,
          email: user.email,
          orgId: user.orgId
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.orgId = (user as any).orgId;
        
        // Fetch the user's role and all associated permissions from the DB
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            role: {
              include: { permissions: true }
            }
          }
        });

        // Map permissions into an array: e.g., ["ACCOUNTS:READ", "PAYROLL:UPDATE"]
        if (dbUser?.role) {
          token.roleName = dbUser.role.name;
          token.permissions = dbUser.role.permissions.map(
            (p) => `${p.module}:${p.action}`
          );
        } else {
          token.roleName = null;
          token.permissions = [];
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).orgId = token.orgId;
        (session.user as any).roleName = token.roleName;
        (session.user as any).permissions = (token.permissions as string[]) || [];
      }
      return session;
    }
  },
  pages: {
    signIn: '/login', 
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };