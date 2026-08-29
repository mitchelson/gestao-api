import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Public } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthorizationService } from '../../common/services/authorization.service';
import type { RequestUser } from '../../common/types/auth.types';
import { FeedService } from './feed.service';

@Controller('v1/feed')
export class FeedController {
  constructor(
    private readonly feedService: FeedService,
    private readonly authz: AuthorizationService,
  ) {}

  @Public()
  @Get()
  list(@Query('page') pageStr?: string, @CurrentUser() user?: RequestUser) {
    const page = parseInt(pageStr || '1', 10);
    return this.feedService.list(page, user?.userId ?? null);
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser | undefined,
    @Body()
    body: {
      conteudo?: string;
      imagem_url?: string;
      link?: string;
      ministerio_ids?: string[];
      user_ids?: string[];
    },
  ) {
    const u = this.authz.requireAuth(user);
    if (u.role !== 'admin' && u.role !== 'lider' && u.role !== 'supervisor') {
      throw new ForbiddenException('Sem permissão para postar');
    }
    if (!body.conteudo && !body.imagem_url) {
      throw new BadRequestException('Conteúdo ou imagem obrigatório');
    }
    try {
      const post = await this.feedService.create(u, body);
      return post;
    } catch (error: unknown) {
      console.error('Erro ao criar post:', error);
      const msg = error instanceof Error ? error.message : 'Erro ao criar post';
      throw new InternalServerErrorException(msg);
    }
  }

  @Put(':id')
  async update(
    @CurrentUser() user: RequestUser | undefined,
    @Param('id') id: string,
    @Body() body: { conteudo?: string; imagem_url?: string; fixado?: boolean },
  ) {
    const u = this.authz.requireAuth(user);
    if (!(await this.feedService.canModify(u, id))) {
      throw new ForbiddenException('Sem permissão');
    }
    return this.feedService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: RequestUser | undefined,
    @Param('id') id: string,
  ) {
    const u = this.authz.requireAuth(user);
    if (!(await this.feedService.canModify(u, id))) {
      throw new ForbiddenException('Sem permissão');
    }
    await this.feedService.delete(id);
    return { ok: true };
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  async like(
    @CurrentUser() user: RequestUser | undefined,
    @Param('id') id: string,
  ) {
    const u = this.authz.requireAuth(user);
    await this.feedService.like(id, u.userId);
    return { ok: true };
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  async unlike(
    @CurrentUser() user: RequestUser | undefined,
    @Param('id') id: string,
  ) {
    const u = this.authz.requireAuth(user);
    await this.feedService.unlike(id, u.userId);
    return { ok: true };
  }

  @Public()
  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.feedService.getComments(id);
  }

  @Post(':id/comments')
  async addComment(
    @CurrentUser() user: RequestUser | undefined,
    @Param('id') id: string,
    @Body() body: { conteudo?: string },
  ) {
    const u = this.authz.requireAuth(user);
    if (!body.conteudo?.trim()) {
      throw new BadRequestException('Conteúdo obrigatório');
    }
    const comment = await this.feedService.addComment(id, u.userId, body.conteudo);
    return comment;
  }

  @Delete(':id/comments')
  @HttpCode(HttpStatus.OK)
  async deleteComment(
    @CurrentUser() user: RequestUser | undefined,
    @Body() body: { comment_id?: string },
  ) {
    const u = this.authz.requireAuth(user);
    if (!body.comment_id) {
      throw new BadRequestException('comment_id obrigatório');
    }
    const ok = await this.feedService.deleteComment(u, body.comment_id);
    if (!ok) {
      throw new ForbiddenException('Sem permissão');
    }
    return { ok: true };
  }
}
