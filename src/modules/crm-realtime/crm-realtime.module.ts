import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CrmRealtimeEventsListener } from './application/listeners/crm-realtime-events.listener';
import { CrmRealtimePublisherService } from './application/services/crm-realtime-publisher.service';
import { CrmSseHubService } from './infrastructure/services/crm-sse-hub.service';
import { CrmRealtimeController } from './presentation/crm-realtime.controller';

@Global()
@Module({
  imports: [JwtModule],
  controllers: [CrmRealtimeController],
  providers: [
    CrmSseHubService,
    CrmRealtimePublisherService,
    CrmRealtimeEventsListener,
  ],
  exports: [CrmRealtimePublisherService],
})
export class CrmRealtimeModule {}
