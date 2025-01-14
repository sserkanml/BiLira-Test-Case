import { Injectable, OnModuleInit, Logger, Inject, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Consumer, Kafka, Producer } from 'kafkajs';
import { Model } from 'mongoose';
import { Message } from 'src/schemas/message.schema';

const MAX_RETRIES = 3;
const RETRY_TOPIC = 'user-events-retry';
const DLQ_TOPIC = 'user-events-dlq';

interface RetryMessage {
    originalMessage: any;
    retryCount: number;
    error: string;
    timestamp: number;
}

@Injectable()
export class ConsumeService implements OnModuleInit, OnModuleDestroy {
    private consumer: Consumer;
    private retryConsumer: Consumer;
    private producer: Producer;
    private kafka: Kafka;

    constructor(
        private readonly configService: ConfigService,
        @InjectModel(Message.name) private readonly messageModel: Model<Message>,
        @Inject('LOGGER') private readonly logger: Logger
    ) {
        this.kafka = new Kafka({
            clientId: this.configService.get<string>('KAFKA_CLIENT_ID'),
            brokers: [this.configService.get<string>('KAFKA_BROKER_URL')],
            retry: {
                initialRetryTime: 1000,
                retries: 10
            }
        });

        this.consumer = this.kafka.consumer({
            groupId: this.configService.get<string>('KAFKA_GROUP_ID'),
            maxWaitTimeInMs: 5000,
            retry: {
                maxRetryTime: 30000,
                initialRetryTime: 1000,
                retries: 10
            }
        });

        this.retryConsumer = this.kafka.consumer({
            groupId: `${this.configService.get<string>('KAFKA_GROUP_ID')}-retry`
        });

        this.producer = this.kafka.producer();
    }

    async onModuleInit() {
        try {
            await this.ensureTopicsExist();

            await this.producer.connect();
            await this.consumer.connect();
            await this.retryConsumer.connect();

            this.logger.log({ message: 'Connected to Kafka', level: 'info' });

            await this.consumer.subscribe({
                topic: this.configService.get<string>('KAFKA_TOPIC'),
                fromBeginning: true
            });

            await this.retryConsumer.subscribe({
                topic: RETRY_TOPIC,
                fromBeginning: true
            });

            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    await this.processMessage(message, false);
                },
            });

            await this.retryConsumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    await this.processMessage(message, true);
                },
            });

        } catch (error) {
            this.logger.error({ message: 'Error initializing consumer:', error, level: 'error' });
            throw error;
        }
    }

    private async ensureTopicsExist() {
        const admin = this.kafka.admin();

        try {
            await admin.connect();

            const topics = await admin.listTopics();

            const topicsToCreate = [];

            if (!topics.includes(RETRY_TOPIC)) {
                topicsToCreate.push({
                    topic: RETRY_TOPIC,
                    numPartitions: 3,
                    replicationFactor: 1
                });
            }

            if (!topics.includes(DLQ_TOPIC)) {
                topicsToCreate.push({
                    topic: DLQ_TOPIC,
                    numPartitions: 3,
                    replicationFactor: 1
                });
            }

            if (topicsToCreate.length > 0) {
                await admin.createTopics({
                    topics: topicsToCreate
                });
                this.logger.log({
                    message: `Created topics: ${topicsToCreate.map(t => t.topic).join(', ')}`,
                    level: 'info'
                });
            }
        } catch (error) {
            this.logger.error({
                message: 'Error ensuring topics exist:',
                error,
                level: 'error'
            });
            throw error;
        } finally {
            await admin.disconnect();
        }
    }

    private async processMessage(message: any, isRetry: boolean) {
        try {
            const value = message.value.toString();
            let parsedMessage: any;
            let retryCount = 0;

            if (isRetry) {
                const retryMessage: RetryMessage = JSON.parse(value);
                parsedMessage = retryMessage.originalMessage;
                retryCount = retryMessage.retryCount;

                this.logger.log({
                    message: `Processing retry message:`,
                    data: {
                        originalMessage: parsedMessage,
                        retryCount: retryCount,
                        error: retryMessage.error
                    },
                    level: 'info'
                });
            } else {
                parsedMessage = JSON.parse(value);
                this.logger.log({
                    message: `Processing new message:`,
                    data: parsedMessage,
                    level: 'info'
                });
            }

            const newMessage = new this.messageModel(parsedMessage);
            const savedMessage = await newMessage.save();
            this.logger.log({
                message: 'Message saved to MongoDB',
                data: {
                    messageId: savedMessage._id,
                    content: savedMessage,
                    retryCount: retryCount
                },
                level: 'info'
            });

        } catch (error) {
            await this.handleError(message.value, error, isRetry);
        }
    }

    private async handleError(messageValue: any, error: Error, isRetry: boolean) {
        let parsedMessage: any;
        let retryCount = 0;

        try {
            if (isRetry) {
                const retryMessage: RetryMessage = JSON.parse(messageValue.toString());
                parsedMessage = retryMessage.originalMessage;
                retryCount = retryMessage.retryCount;
            } else {
                parsedMessage = JSON.parse(messageValue.toString());
            }
        } catch (parseError) {
            parsedMessage = messageValue.toString();
        }

        this.logger.error({
            message: `Error processing message: ${error.message}`,
            error,
            level: 'error'
        });

        if (retryCount < MAX_RETRIES) {
            await this.sendToRetryTopic({
                originalMessage: parsedMessage,
                retryCount: retryCount + 1,
                error: error.message,
                timestamp: Date.now()
            });
        } else {
            await this.sendToDLQ({
                originalMessage: parsedMessage,
                retryCount,
                error: error.message,
                timestamp: Date.now()
            });
        }
    }

    private async sendToRetryTopic(retryMessage: RetryMessage) {
        try {
            await this.producer.send({
                topic: RETRY_TOPIC,
                messages: [{
                    value: JSON.stringify(retryMessage)
                }]
            });

            this.logger.log({
                message: `Message sent to retry topic (attempt ${retryMessage.retryCount})`,
                level: 'info'
            });
        } catch (error) {
            this.logger.error({
                message: 'Failed to send message to retry topic',
                error,
                level: 'error'
            });
        }
    }

    private async sendToDLQ(dlqMessage: RetryMessage) {
        try {
            await this.producer.send({
                topic: DLQ_TOPIC,
                messages: [{
                    value: JSON.stringify(dlqMessage)
                }]
            });

            this.logger.error({
                message: `Message sent to DLQ after ${dlqMessage.retryCount} retries`,
                level: 'error'
            });
        } catch (error) {
            this.logger.error({
                message: 'Failed to send message to DLQ',
                error,
                level: 'error'
            });
        }
    }

    async onModuleDestroy() {
        try {
            this.logger.log('Gracefully shutting down consumer...');
            await this.consumer.disconnect();
            await this.retryConsumer.disconnect();
            await this.producer.disconnect();
            this.logger.log('Consumer shutdown complete');
        } catch (error) {
            this.logger.error('Error during shutdown:', error);
        }
    }
}
