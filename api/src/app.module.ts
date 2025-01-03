import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageSchema, Message } from './schemas/message.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';
import * as fs from 'fs';
import { createLogger } from './global/utils/logger';
import { MetricsModule } from './metrics/metrics.module';
import { RedisModule, RedisModuleOptions } from '@nestjs-modules/ioredis';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Message', schema: MessageSchema }]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: configService.get<string>('REDIS_HOST'),
      }),
      inject: [ConfigService],
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
    }),
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: 'LOGGER',
      useFactory: (configService: ConfigService) => {
        return createLogger(configService);
      },
      inject: [ConfigService],
    }
  ],
  exports: ['LOGGER'],
})
export class AppModule {
  
}
