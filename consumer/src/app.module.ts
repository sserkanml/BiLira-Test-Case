import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConsumeService } from './consume/consume.service';
import { ConsumeModule } from './consume/consume.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';
import * as fs from 'fs';
import { createLogger } from './global/utils/logger';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true, 
  }),
   PrometheusModule.register({
    defaultMetrics: {
      enabled: true,
      config: {
        prefix: 'nestjs_consumer_metrics_',
      },
    },
  }),
  MongooseModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const uri = configService.get<string>('MONGO_URI_FILE') ? fs.readFileSync(configService.get<string>('MONGO_URI_FILE'), 'utf8') : configService.get<string>('MONGO_URI');

      mongoose.connection.on('connected', () => {
        console.log('Connected to MongoDB successfully');
      });

      mongoose.connection.on('error', (error) => {
        console.error('Failed to connect to MongoDB:', error.message);
      });

      return { uri };
    },
  }),ConsumeModule],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: 'LOGGER',
      useFactory: (configService: ConfigService) => {
        return createLogger(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['LOGGER'],
})
export class AppModule {}
