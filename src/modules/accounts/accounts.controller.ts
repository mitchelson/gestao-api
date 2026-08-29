import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/auth.types';
import { AccountsService } from './accounts.service';

@Controller('v1/accounts/:id/roles')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  getRoles(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.accountsService.getRoles(user, id);
  }

  @Post()
  assignRole(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.accountsService.assignRole(
      user,
      id,
      body as Parameters<AccountsService['assignRole']>[2],
    );
  }

  @Delete()
  removeRole(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.accountsService.removeRole(
      user,
      id,
      body as Parameters<AccountsService['removeRole']>[2],
    );
  }
}
