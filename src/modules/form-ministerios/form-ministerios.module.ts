import { Module } from '@nestjs/common';
import {
  FormMinisteriosAdminController,
  FormMinisteriosController,
} from './form-ministerios.controller';
import { FormMinisteriosService } from './form-ministerios.service';

@Module({
  controllers: [FormMinisteriosController, FormMinisteriosAdminController],
  providers: [FormMinisteriosService],
})
export class FormMinisteriosModule {}
