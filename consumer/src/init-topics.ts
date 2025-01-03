import { Kafka } from 'kafkajs';

const createTopics = async () => {
    const kafka = new Kafka({
        clientId: 'admin',
        brokers: [process.env.KAFKA_BROKER_URL || 'localhost:9092'],
    });

    const admin = kafka.admin();

    try {
        await admin.connect();
        
        await admin.createTopics({
            topics: [
                { 
                    topic: 'user-events-retry',
                    numPartitions: 3,
                    replicationFactor: 1
                },
                {
                    topic: 'user-events-dlq',
                    numPartitions: 3,
                    replicationFactor: 1
                }
            ]
        });

        console.log('Retry and DLQ topics created successfully');
    } catch (error) {
        console.error('Error creating topics:', error);
    } finally {
        await admin.disconnect();
    }
};

createTopics().catch(console.error); 