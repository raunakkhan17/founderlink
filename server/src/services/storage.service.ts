import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { config } from '../config/env';

export class StorageService {
  private static s3Client: S3Client | null = null;

  private static getClient(): S3Client | null {
    if (this.s3Client) return this.s3Client;

    if (config.STORAGE_ACCESS_KEY && config.STORAGE_SECRET_KEY && config.STORAGE_BUCKET) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: config.STORAGE_ENDPOINT || undefined,
        credentials: {
          accessKeyId: config.STORAGE_ACCESS_KEY,
          secretAccessKey: config.STORAGE_SECRET_KEY,
        },
      });
      return this.s3Client;
    }

    return null;
  }

  static async uploadFile(
    file: Express.Multer.File,
    folder: string = 'documents'
  ): Promise<{ fileUrl: string; key: string }> {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueFilename = `${crypto.randomUUID()}${ext}`;
    const key = `${folder}/${uniqueFilename}`;

    const client = this.getClient();

    if (client && config.STORAGE_BUCKET && process.env.NODE_ENV !== 'test') {
      try {
        await client.send(
          new PutObjectCommand({
            Bucket: config.STORAGE_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
        );

        const publicBase = config.STORAGE_PUBLIC_URL || (config.STORAGE_ENDPOINT ? `${config.STORAGE_ENDPOINT}/${config.STORAGE_BUCKET}` : '');
        const fileUrl = publicBase ? `${publicBase.replace(/\/$/, '')}/${key}` : `https://storage.founderlink.com/${key}`;
        return { fileUrl, key };
      } catch (err: any) {
        console.warn(`[Storage] Remote S3/R2 upload failed (${err.message}), falling back to local storage.`);
      }
    }

    // Local / development fallback
    const uploadsDir = path.resolve(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const localFilePath = path.join(uploadsDir, uniqueFilename);
    fs.writeFileSync(localFilePath, file.buffer);

    const baseUrl = config.STORAGE_PUBLIC_URL || `http://localhost:${config.PORT}/uploads`;
    const fileUrl = `${baseUrl.replace(/\/$/, '')}/${folder}/${uniqueFilename}`;
    return { fileUrl, key };
  }

  static async deleteFile(keyOrUrl: string): Promise<void> {
    const client = this.getClient();
    let key = keyOrUrl;

    if (keyOrUrl.startsWith('http')) {
      const url = new URL(keyOrUrl);
      key = url.pathname.replace(/^\//, '').replace(/^uploads\//, '');
    }

    if (client && config.STORAGE_BUCKET) {
      try {
        await client.send(
          new DeleteObjectCommand({
            Bucket: config.STORAGE_BUCKET,
            Key: key,
          })
        );
      } catch (err) {
        console.warn(`[Storage] Failed to delete S3/R2 file: ${key}`, err);
      }
    } else {
      const localFilePath = path.resolve(process.cwd(), 'uploads', key);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    }
  }
}
