import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/auth.decorators';
import { DatabaseService } from '../database/database.service';

@Controller()
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Public()
  @Get('health')
  async getHealth() {
    const dbOk = await this.database.ping();
    return {
      status: 'ok',
      db: dbOk ? 'connected' : 'disconnected',
      version: process.env.npm_package_version ?? '0.1.0',
    };
  }
}
