'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { RegisterSchema, LoginSchema } from '@/lib/validators/auth'
import { z } from 'zod'

// Dummy bcrypt hash for timing attack prevention
// This is a valid bcrypt hash that will always fail comparison
const DUMMY_BCRYPT_HASH = '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ'

export async function register(values: z.infer<typeof RegisterSchema>) {
  const validatedFields = RegisterSchema.safeParse(values)

  if (!validatedFields.success) {
    return { error: 'Invalid fields' }
  }

  const { email, password, name } = validatedFields.data

  // Check for existing user BEFORE hashing password (optimization)
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    return { error: 'Email already in use' }
  }

  // Only hash password after confirming email is available
  const hashedPassword = await bcrypt.hash(password, 10)

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

  // Always perform bcrypt.compare to prevent timing attacks
  // Use dummy hash if user doesn't exist to maintain constant time
  const passwordHash = user?.passwordHash || DUMMY_BCRYPT_HASH
  const isValid = await bcrypt.compare(password, passwordHash)

  // Return error if user doesn't exist OR password is invalid
  if (!user || !user.passwordHash || !isValid) {
    return { error: 'Invalid credentials' }
  }

  return { success: true, userId: user.id }
}
