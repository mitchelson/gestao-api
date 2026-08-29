import { Module } from '@nestjs/common';
import {
  DonsEspirituaisAdminController,
  DonsEspirituaisController,
} from './dons-espirituais.controller';
import { DonsEspirituaisService } from './dons-espirituais.service';

@Module({
  controllers: [DonsEspirituaisController, DonsEspirituaisAdminController],
  providers: [DonsEspirituaisService],
})
export class DonsEspirituaisModule {}
