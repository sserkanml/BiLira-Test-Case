import { Inject, Injectable, Logger } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { Message } from './schemas/message.schema';
import { InjectModel } from '@nestjs/mongoose';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class AppService {
  constructor(@InjectModel('Message') private messageModel: Model<Message>, @Inject('LOGGER') private readonly logger: Logger,
   @InjectRedis() private readonly redisClient: Redis) { }

  async findMessages(
    eventType?: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      this.logger.log({ message: 'Fetching messages', level: 'info' });
      console.log("merhaba");
      const cacheKey = `messages:${page}:${limit}:${eventType || 'all'}:${startDate || 'none'}:${endDate || 'none'}`;

      const cachedData = await this.redisClient.get(cacheKey);
      if (cachedData) {
        this.logger.log({ message: 'Cache hit for messages', level: 'info' });
        return JSON.parse(cachedData);
      }

      const skip = (page - 1) * limit;
      const filter: any = {};

      if (eventType) {
        filter.eventType = eventType;
      }

      if (eventType) {
        filter.eventType = eventType;
      }

      if (startDate || endDate) {
        filter.timestamp = {};

        if (startDate) {
          const start = new Date(`${startDate}T00:00:00.000Z`);
          if (!isNaN(start.getTime())) {
            filter.timestamp.$gte = start;
          } else {
            this.logger.error({ message: `Invalid startDate format: ${startDate}`, level: 'error' });
            throw new Error(`Invalid startDate format: ${startDate}`);
          }
        }

        if (endDate) {
          const end = new Date(`${endDate}T23:59:59.999Z`);
          if (!isNaN(end.getTime())) {
            filter.timestamp.$lte = end;
          } else {
            this.logger.error({ message: `Invalid endDate format: ${endDate}`, level: 'error' });
            throw new Error(`Invalid endDate format: ${endDate}`);
          }
        }
      }



      const messages = await this.messageModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ timestamp: -1 })
        .lean()
        .exec();

      const totalMessages = await this.messageModel.countDocuments(filter).exec();

      const result = {
        message: 'Messages fetched successfully',
        data: messages,
        totalCount: totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
        currentPage: page,
      };

      await this.redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600); 

      this.logger.log({ message: 'Messages fetched successfully', level: 'info' });
      return result;
    } catch (error) {
      this.logger.error({ message: 'Error fetching messages', error, level: 'error' });
      throw new Error('Error fetching messages');
    }
  }
}
