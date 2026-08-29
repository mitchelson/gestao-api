import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/auth.types';
import { RepertorioService } from './repertorio.service';

@Controller('v1/repertorio')
export class RepertorioController {
  constructor(private readonly repertorioService: RepertorioService) {}

  @Public()
  @Get()
  get(
    @Query('evento_id') eventoId: string,
    @CurrentUser() user?: RequestUser,
  ) {
    if (!eventoId) {
      throw new BadRequestException('evento_id required');
    }
    return this.repertorioService.get(eventoId, user?.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  save(@CurrentUser() user: RequestUser, @Body() body: Record<string, unknown>) {
    return this.repertorioService.save(user.userId, body);
  }

  @Delete()
  deleteAll(
    @CurrentUser() user: RequestUser,
    @Body() body: { evento_id: string },
  ) {
    return this.repertorioService.deleteAll(user.userId, body.evento_id);
  }
}
