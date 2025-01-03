import { Module } from '@nestjs/common';
import { ProduceService } from './produce.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createLogger } from 'src/global/utils/logger';

@Module({
  providers: [ProduceService,
    {
      provide: 'LOGGER',
      useFactory: (configService: ConfigService) => {
        return createLogger(configService);
      },
      inject: [ConfigService],
    },
  ],
  imports: [
    ConfigModule,
  ],
  exports: ['LOGGER'],
})
export class ProduceModule {}
