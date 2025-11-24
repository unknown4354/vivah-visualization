import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'exports'

export interface UploadResult {
  url: string
  key: string
  size: number
}

export class StorageService {
  // Upload buffer to Supabase storage
  static async uploadBuffer(
    buffer: Buffer,
    path: string,
    contentType: string
  ): Promise<UploadResult> {
    const filename = `${crypto.randomUUID()}${this.getExtension(contentType)}`
    const key = `${path}/${filename}`

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(key, buffer, {
        contentType,
        cacheControl: '31536000', // 1 year cache
        upsert: false
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(key)

    return {
      url: urlData.publicUrl,
      key,
      size: buffer.length
    }
  }

  // Upload from URL (fetch and re-upload)
  static async uploadFromUrl(
    sourceUrl: string,
    path: string
  ): Promise<UploadResult> {
    const response = await fetch(sourceUrl)
    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    return this.uploadBuffer(buffer, path, contentType)
  }

  // Get signed URL for private objects
  static async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(key, expiresIn)

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`)
    }

    return data.signedUrl
  }

  // Delete object from storage
  static async deleteObject(key: string): Promise<void> {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([key])

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  }

  // Get file extension from content type
  private static getExtension(contentType: string): string {
    const extensions: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/webp': '.webp',
      'model/gltf-binary': '.glb',
      'model/gltf+json': '.gltf'
    }
    return extensions[contentType] || ''
  }

  // Get content type from format
  static getContentType(format: string): string {
    const contentTypes: Record<string, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      glb: 'model/gltf-binary',
      gltf: 'model/gltf+json'
    }
    return contentTypes[format.toLowerCase()] || 'application/octet-stream'
  }
}

// Helper function for simpler uploads
export async function uploadToStorage(
  data: Buffer | string,
  path: string,
  contentType?: string
): Promise<string> {
  if (typeof data === 'string') {
    // It's a URL, fetch and upload
    const result = await StorageService.uploadFromUrl(data, path)
    return result.url
  }

  // It's a buffer
  const result = await StorageService.uploadBuffer(
    data,
    path,
    contentType || 'application/octet-stream'
  )
  return result.url
}
