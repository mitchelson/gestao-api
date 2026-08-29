import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class UploadService {
  private readonly uploadDir = process.env.UPLOAD_DIR ?? '/var/gestao-api/uploads';

  private publicBaseUrl(): string {
    const explicit = process.env.UPLOAD_BASE_URL?.trim().replace(/\/$/, '');
    if (explicit) return explicit;
    const api = (process.env.PUBLIC_API_URL ?? 'https://gestao-api.pibrr.com').replace(
      /\/$/,
      '',
    );
    return `${api}/uploads`;
  }

  async saveFile(file: Express.Multer.File): Promise<{ url: string }> {
    await mkdir(this.uploadDir, { recursive: true });
    const safeName = file.originalname.replace(/[^\w.\-]+/g, '_');
    const filename = `${Date.now()}-${safeName}`;
    const filepath = join(this.uploadDir, filename);
    await writeFile(filepath, file.buffer);
    return { url: `${this.publicBaseUrl()}/${filename}` };
  }

  getUploadDir() {
    return this.uploadDir;
  }
}
