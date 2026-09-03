import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Public } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/auth.types';
import { UsersService } from './users.service';

@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: RequestUser) {
    return this.usersService.getMe(user.userId);
  }

  @Put('me')
  updateMe(@CurrentUser() user: RequestUser, @Body() body: Record<string, unknown>) {
    return this.usersService.updateMe(user.userId, body);
  }

  @Delete('me')
  deleteMe(@CurrentUser() user: RequestUser) {
    return this.usersService.deleteMe(user.userId);
  }

  @Get('me/indisponibilidades')
  getIndisponibilidades(@CurrentUser() user: RequestUser) {
    return this.usersService.getIndisponibilidades(user.userId);
  }

  @Post('me/indisponibilidades')
  @HttpCode(HttpStatus.CREATED)
  createIndisponibilidade(
    @CurrentUser() user: RequestUser,
    @Body() body: { data_inicio?: string; data_fim?: string; motivo?: string },
  ) {
    return this.usersService.createIndisponibilidade(user.userId, body);
  }

  @Delete('me/indisponibilidades')
  deleteIndisponibilidade(
    @CurrentUser() user: RequestUser,
    @Body() body: { id: string },
  ) {
    return this.usersService.deleteIndisponibilidade(user.userId, body.id);
  }

  @Get('me/ministerios')
  getMyMinisterios(@CurrentUser() user: RequestUser) {
    return this.usersService.getMyMinisterios(user.userId);
  }

  @Post('me/ministerios')
  @HttpCode(HttpStatus.CREATED)
  joinMinisterio(
    @CurrentUser() user: RequestUser,
    @Body() body: { ministerio_id: string },
  ) {
    return this.usersService.joinMinisterio(user.userId, body.ministerio_id);
  }

  @Get('me/pendencias')
  getPendencias(@CurrentUser() user: RequestUser) {
    return this.usersService.getPendencias(user.userId);
  }

  @Get('me/inbox')
  getInbox(@CurrentUser() user: RequestUser) {
    return this.usersService.getInbox(user);
  }

  @Get()
  listUsers(@CurrentUser() user: RequestUser) {
    return this.usersService.listUsers(user);
  }

  @Put()
  updateUser(@CurrentUser() user: RequestUser, @Body() body: Record<string, unknown>) {
    return this.usersService.updateUser(user, body as Parameters<UsersService['updateUser']>[1]);
  }

  @Delete()
  deleteUser(@CurrentUser() user: RequestUser, @Body() body: { id: string }) {
    return this.usersService.deleteUser(user, body.id);
  }

  @Post('ministerios')
  @HttpCode(HttpStatus.CREATED)
  addUserMinisterio(@CurrentUser() user: RequestUser, @Body() body: Record<string, unknown>) {
    return this.usersService.addUserMinisterio(
      user,
      body as Parameters<UsersService['addUserMinisterio']>[1],
    );
  }

  @Delete('ministerios')
  removeUserMinisterio(
    @CurrentUser() user: RequestUser,
    @Body() body: { user_id: string; ministerio_id: string },
  ) {
    return this.usersService.removeUserMinisterio(user, body);
  }

  @Public()
  @Get(':id/profile')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
