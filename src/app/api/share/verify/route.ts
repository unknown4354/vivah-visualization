import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token required' },
        { status: 400 }
      )
    }

    // Find share link
    const shareLink = await prisma.shareLink.findUnique({
      where: { token }
    })

    if (!shareLink) {
      return NextResponse.json({
        valid: false,
        error: 'Share link not found'
      })
    }

    // Check expiration
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'This share link has expired'
      })
    }

    // Check max views
    if (shareLink.maxViews && shareLink.currentViews >= shareLink.maxViews) {
      return NextResponse.json({
        valid: false,
        error: 'This share link has reached its view limit'
      })
    }

    // Check password
    if (shareLink.password) {
      if (!password) {
        return NextResponse.json({
          valid: false,
          requiresPassword: true
        })
      }

      const isValid = await bcrypt.compare(password, shareLink.password)
      if (!isValid) {
        return NextResponse.json({
          valid: false,
          error: 'Invalid password'
        })
      }
    }

    // Update view count
    await prisma.shareLink.update({
      where: { token },
      data: {
        currentViews: { increment: 1 },
        lastViewedAt: new Date()
      }
    })

    return NextResponse.json({
      valid: true,
      projectId: shareLink.projectId,
      permissions: {
        canEdit: shareLink.canEdit,
        canComment: shareLink.canComment,
        canExport: shareLink.canExport
      }
    })
  } catch (error) {
    console.error('Share link verification error:', error)
    return NextResponse.json(
      { valid: false, error: 'Verification failed' },
      { status: 500 }
    )
  }
}
