import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { RegisterSchema } from '@/lib/validators/auth'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize rate limiter - 5 attempts per hour per IP
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  analytics: true,
})

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') ??
               req.headers.get('x-real-ip') ??
               'anonymous'

    try {
      const { success, limit, reset, remaining } = await ratelimit.limit(ip)

      if (!success) {
        return NextResponse.json(
          {
            error: 'Too many registration attempts. Please try again later.',
            retryAfter: Math.ceil((reset - Date.now()) / 1000)
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
            }
          }
        )
      }
    } catch (rateLimitError) {
      // Log error but fail closed - don't allow registration if rate limiter fails
      console.error('Rate limiter error:', rateLimitError)
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    const body = await req.json()
    const validatedFields = RegisterSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Invalid fields', details: validatedFields.error.issues },
        { status: 400 }
      )
    }

    const { email, password, name } = validatedFields.data

    // Check for existing user BEFORE hashing password
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      )
    }

    // Only hash password after confirming email is available
    const hashedPassword = await bcrypt.hash(password, 10)

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
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
