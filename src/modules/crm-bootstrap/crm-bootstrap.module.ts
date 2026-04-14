import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CrmBootstrapService } from './application/crm-bootstrap.service';
import { CrmBootstrapController } from './presentation/crm-bootstrap.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CrmBootstrapController],
  providers: [CrmBootstrapService],
})
export class CrmBootstrapModule {}
