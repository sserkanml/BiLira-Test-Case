import { Module } from '@nestjs/common';
import { ConsumeService } from './consume.service';
import { Message } from 'src/schemas/message.schema';
import { MessageSchema } from 'src/schemas/message.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createLogger } from 'src/global/utils/logger';

@Module({
    providers: [ConsumeService,
        {
            provide: 'LOGGER',
            useFactory: (configService: ConfigService) => {
              return createLogger(configService);
            },
            inject: [ConfigService],
          }
    ],
    imports: [ConfigModule, MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }])],
    exports: [ConsumeService, 'LOGGER'],
})
export class ConsumeModule { }
