import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/auth.decorators';

@Controller('v1')
export class V1Controller {
  @Public()
  @Get()
  getInfo() {
    return {
      name: 'gestao-api',
      version: 'v1',
      docs: 'https://github.com/mitchelson/gestao-api',
    };
  }
}
