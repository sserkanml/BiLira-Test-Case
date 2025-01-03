import * as winston from 'winston';
import LokiTransport from 'winston-loki';
import { ConfigService } from '@nestjs/config';

export const createLogger = (configService: ConfigService): winston.Logger => {
    const lokiUrl = configService.get<string>('LOKI_HOST');
    console.log(lokiUrl);

    return winston.createLogger({
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize({ all: true }),
                    winston.format.timestamp(),
                    winston.format.errors({ stack: true }),
                    winston.format.printf(({ timestamp, level, message, ...meta }) => {
                        const logMessage =
                            typeof message === 'object'
                                ? JSON.stringify(message, null, 2)
                                : message;

                        const metaInfo = Object.keys(meta).length > 0
                            ? ` ${JSON.stringify(
                                Object.fromEntries(
                                    Object.entries(meta).filter(([key]) => typeof key !== 'symbol')
                                ),
                                null,
                                2
                            )}`
                            : '';

                        return `[${timestamp}] [${level}]: ${logMessage}${metaInfo}`;
                    }),
                ),
            }),
            new winston.transports.File({
                filename: 'logs/app.log',
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json(),
                ),
            }),
            new LokiTransport({
                host: lokiUrl,
                labels: { app: 'api' },
                json: true,
                batching: true,
                clearOnError: false,  
                replaceTimestamp: true,
                gracefulShutdown: true,
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                ),
                onConnectionError: (err) => {
                    console.error('Loki connection error:', err);
                },
                
            })
        ],
    });
};
