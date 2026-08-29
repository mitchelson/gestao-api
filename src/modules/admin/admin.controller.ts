import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async dashboard() {
    try {
      return await this.adminService.getDashboard();
    } catch (error) {
      console.error('Erro ao buscar dashboard admin:', error);
      throw new InternalServerErrorException('Erro ao buscar dashboard');
    }
  }
}
