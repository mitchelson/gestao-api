import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthorizationService } from '../../common/services/authorization.service';
import type { RequestUser } from '../../common/types/auth.types';
import { UploadService } from './upload.service';

@Controller('v1/upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly authz: AuthorizationService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async upload(
    @CurrentUser() user: RequestUser | undefined,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    this.authz.requireAuth(user);
    if (!file) {
      throw new BadRequestException('Arquivo obrigatório');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Arquivo muito grande (máx 5MB)');
    }
    return this.uploadService.saveFile(file);
  }
}
