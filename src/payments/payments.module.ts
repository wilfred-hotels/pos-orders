import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Payment } from '../entities/payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MpesaService } from './mpesa.service';

@Module({
  imports: [SequelizeModule.forFeature([Payment])],
  providers: [PaymentsService, MpesaService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
