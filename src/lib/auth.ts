import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./db"
import bcrypt from "bcryptjs"
import { z } from "zod"

const prismaAdapter = PrismaAdapter(prisma)

const customAdapter = {
  ...prismaAdapter,
  async createUser(data: any) {
    const { name, image, emailVerified, ...rest } = data
    const user = await prisma.user.create({
      data: {
        ...rest,
        nombre: name,
        fotoPerfil: image,
      },
    })
    return {
      ...user,
      name: user.nombre,
      image: user.fotoPerfil,
    } as any
  },
  async updateUser(data: any) {
    const { id, name, image, emailVerified, ...rest } = data
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...rest,
        nombre: name,
        fotoPerfil: image,
      },
    })
    return {
      ...user,
      name: user.nombre,
      image: user.fotoPerfil,
    } as any
  },
  async getUser(id: string) {
    if (!prismaAdapter.getUser) return null
    const user = await prismaAdapter.getUser(id)
    if (!user) return null
    return {
      ...user,
      name: (user as any).nombre,
      image: (user as any).fotoPerfil,
    }
  },
  async getUserByEmail(email: string) {
    if (!prismaAdapter.getUserByEmail) return null
    const user = await prismaAdapter.getUserByEmail(email)
    if (!user) return null
    return {
      ...user,
      name: (user as any).nombre,
      image: (user as any).fotoPerfil,
    }
  },
  async getUserByAccount(provider_providerAccountId: any) {
    if (!prismaAdapter.getUserByAccount) return null
    const user = await prismaAdapter.getUserByAccount(provider_providerAccountId)
    if (!user) return null
    return {
      ...user,
      name: (user as any).nombre,
      image: (user as any).fotoPerfil,
    }
  },
  async getSessionAndUser(sessionToken: string) {
    if (!prismaAdapter.getSessionAndUser) return null
    const sessionAndUser = await prismaAdapter.getSessionAndUser(sessionToken)
    if (!sessionAndUser) return null
    return {
      session: sessionAndUser.session,
      user: {
        ...sessionAndUser.user,
        name: (sessionAndUser.user as any).nombre,
        image: (sessionAndUser.user as any).fotoPerfil,
      },
    }
  },
}

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "super-secret-fallback-key-change-in-prod"
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: customAdapter,
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || "mock-id",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "mock-secret",
    }),
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (!parsedCredentials.success) return null

        const { email, password } = parsedCredentials.data
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.passwordHash) return null

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash)
        if (passwordsMatch) {
          return {
            id: user.id,
            email: user.email,
            name: user.nombre,
            username: user.username,
            phone: user.phone,
          }
        }

        return null
      },
    }),
    Credentials({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ phone: z.string(), code: z.string() })
          .safeParse(credentials)

        if (!parsed.success) return null

        const { phone, code } = parsed.data

        // 1. Verificar OTP en VerificationToken
        const tokenRecord = await prisma.verificationToken.findFirst({
          where: {
            identifier: phone,
            token: code,
            expires: { gte: new Date() },
          },
        })

        if (!tokenRecord) return null

        // 2. Consumir token
        await prisma.verificationToken.delete({
          where: { token: code },
        })

        // 3. Obtener o registrar al usuario
        let user = await prisma.user.findUnique({
          where: { phone },
        })

        if (!user) {
          const rand = Math.floor(1000 + Math.random() * 9000)
          const username = `rider_${phone.slice(-4)}_${rand}`
          user = await prisma.user.create({
            data: {
              phone,
              username,
              nivelExperiencia: "PRINCIPIANTE",
              tipoRider: "URBANO",
            },
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nombre,
          username: user.username,
          phone: user.phone,
          image: user.fotoPerfil,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.phone = user.phone
        token.image = user.image
      }
      
      // Permitir actualización de sesión si el perfil cambia
      if (trigger === "update" && session) {
        token.username = session.username ?? token.username
        token.name = session.name ?? token.name
        token.image = session.image ?? token.image
      }
      
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.phone = token.phone as string
        session.user.image = token.image as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
