import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadBase64(base64: string, publicId: string): Promise<string> {
    const result = await cloudinary.uploader.upload(base64, {
      public_id: publicId,
      folder: 'profile_images',
      overwrite: true,
    });
    return result.secure_url;
  }

  async delete(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch {}
  }

  extractPublicId(url: string): string | null {
    if (!url) return null;
    const parts = url.split('/');
    const file = parts[parts.length - 1];
    const name = file.split('.')[0];
    return `profile_images/${name}`;
  }
}
