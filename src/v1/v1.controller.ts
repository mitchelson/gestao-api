import { Controller, Get } from '@nestjs/common';

@Controller('v1')
export class V1Controller {
  @Get()
  getInfo() {
    return {
      name: 'gestao-api',
      version: 'v1',
      docs: 'https://github.com/mitchelson/gestao-api',
    };
  }
}
