import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Consumer, Kafka } from 'kafkajs';
import { Model } from 'mongoose';
import { Message } from 'src/schemas/message.schema';

@Injectable()
export class ConsumeService implements OnModuleInit {
    private consumer: Consumer;
    private kafka: Kafka;

    constructor(private readonly configService: ConfigService, @InjectModel(Message.name) private readonly messageModel: Model<Message>,
        @Inject('LOGGER') private readonly logger: Logger) {
        this.kafka = new Kafka({
            clientId: this.configService.get<string>('KAFKA_CLIENT_ID'),
            brokers: [this.configService.get<string>('KAFKA_BROKER_URL')],
        });
        this.consumer = this.kafka.consumer({ groupId: this.configService.get<string>('KAFKA_GROUP_ID') });
    }

    async onModuleInit() {
        try {
            this.logger.log({ message: 'Connecting to Kafka', level: 'info' });
            await this.consumer.connect();
            this.logger.log({ message: 'Connected to Kafka', level: 'info' });
            await this.consumer.subscribe({ topic: this.configService.get<string>('KAFKA_TOPIC'), fromBeginning: true });
            this.logger.log({ message: 'Subscribed to Kafka topic', level: 'info' });
            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    try {
                        const value = message.value.toString();
                        this.logger.log({ message: `Received message: ${value}`, level: 'info' });
                        const parsedMessage = JSON.parse(value);
                        const newMessage = new this.messageModel(parsedMessage);
                        await newMessage.save();
                        this.logger.log({ message: 'Message saved to MongoDB', level: 'info' });
                    } catch (error) {
                        this.logger.error({ message: 'Error processing message:', error, level: 'error' });

                    }
                },
            });
        } catch (error) {
            this.logger.error({ message: 'Error connecting to Kafka:', error, level: 'error' });
            throw error;
        }
    }
}
