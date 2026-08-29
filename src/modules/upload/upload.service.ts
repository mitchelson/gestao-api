import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class UploadService {
  private readonly uploadDir = process.env.UPLOAD_DIR ?? '/tmp/uploads';

  async saveFile(file: Express.Multer.File): Promise<{ url: string }> {
    await mkdir(this.uploadDir, { recursive: true });
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = join(this.uploadDir, filename);
    await writeFile(filepath, file.buffer);
    const baseUrl = process.env.UPLOAD_BASE_URL ?? '/uploads';
    return { url: `${baseUrl}/${filename}` };
  }
}
