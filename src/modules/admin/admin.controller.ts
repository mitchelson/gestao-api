import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { Roles } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/auth.types';
import { AdminService } from './admin.service';

@Controller('v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles('admin', 'supervisor', 'lider')
  @Get('dashboard')
  async dashboard(@CurrentUser() user: RequestUser) {
    try {
      return await this.adminService.getDashboard(user);
    } catch (error) {
      console.error('Erro ao buscar dashboard admin:', error);
      throw new InternalServerErrorException('Erro ao buscar dashboard');
    }
  }
}
