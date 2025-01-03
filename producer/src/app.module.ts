import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProduceModule } from './produce/produce.module';
import { ProduceService } from './produce/produce.service';
import { createLogger } from './global/utils/logger';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';



@Module({
  imports: [ScheduleModule.forRoot(), ConfigModule.forRoot({
    isGlobal: true,
  }), ProduceModule, PrometheusModule.register({
    defaultMetrics: {
      enabled: true,
      config: {
        prefix: 'nestjs_producer_metrics_',
      },
    },
  }) ],
  controllers: [AppController],
  providers: [AppService, ProduceService, {
    provide: 'LOGGER',
    useFactory: (configService: ConfigService) => {
      return createLogger(configService);
    },
    inject: [ConfigService],
  },],
  exports: ['LOGGER'],
})
export class AppModule { }
