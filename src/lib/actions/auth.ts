'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { RegisterSchema, LoginSchema } from '@/lib/validators/auth'
import { z } from 'zod'

export async function register(values: z.infer<typeof RegisterSchema>) {
  const validatedFields = RegisterSchema.safeParse(values)

  if (!validatedFields.success) {
    return { error: 'Invalid fields' }
  }

  const { email, password, name } = validatedFields.data
  const hashedPassword = await bcrypt.hash(password, 10)

  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    return { error: 'Email already in use' }
  }

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
        subscription: {
          create: {
            tier: 'free',
            credits: 5
          }
        }
      }
    })

    return { success: true, userId: user.id }
  } catch (error) {
    console.error('Registration error:', error)
    return { error: 'Failed to create account' }
  }
}

export async function login(values: z.infer<typeof LoginSchema>) {
  const validatedFields = LoginSchema.safeParse(values)

  if (!validatedFields.success) {
    return { error: 'Invalid fields' }
  }

  const { email, password } = validatedFields.data

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user || !user.passwordHash) {
    return { error: 'Invalid credentials' }
  }

  const isValid = await bcrypt.compare(password, user.passwordHash)

  if (!isValid) {
    return { error: 'Invalid credentials' }
  }

  return { success: true, userId: user.id }
}
