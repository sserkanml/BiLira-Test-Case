import { Inject, Injectable, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { UserEvent } from 'src/global/enums/user.event';
import { faker } from '@faker-js/faker';
import { StatusEvent } from 'src/global/enums/status.event';


@Injectable()
export class ProduceService {

    private kafka: Kafka;
    private producer: Producer;
    private userEvent: UserEvent[];
    private userStatus: StatusEvent[];

    constructor(private readonly configService: ConfigService, @Inject('LOGGER') private readonly logger: Logger,
    ) {
        this.userEvent = Object.values(UserEvent);
        this.userStatus = Object.values(StatusEvent);
        this.kafka = new Kafka({
            clientId: this.configService.get<string>('KAFKA_CLIENT_ID'),
            brokers: [this.configService.get<string>('KAFKA_BROKER_URL')],
        });
        this.producer = this.kafka.producer();
    }

    private generateMessage() {
        this.logger.log({ message: 'Generating message', level: 'info' });
        return {
            eventId: uuidv4(),
            eventType: this.userEvent[Math.floor(Math.random() * this.userEvent.length)],
            timestamp: new Date(),
            payload: {
                userId: uuidv4(),
                email: faker.internet.email(),
                status: this.userStatus[Math.floor(Math.random() * this.userStatus.length)],
            },
        };
    }

    async startProducing() {
        try {
            await this.producer.connect();
            this.logger.log({ message: 'Producer connected', level: 'info' });

            const message = this.generateMessage();
            await this.producer.send({
                topic: this.configService.get<string>('KAFKA_TOPIC'),
                messages: [{ value: JSON.stringify(message) }],
            });
            this.logger.log({ message: 'Message sent. Sending message is ', data: message, level: 'info' });
        } catch (error) {
            this.logger.error({ message: 'Error occurred during Kafka operation', data: error, level: 'error' });
        }
        finally {
            await this.producer.disconnect();
            this.logger.log({ message: 'Producer disconnected', level: 'info' });

        }
    }
}
