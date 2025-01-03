import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PrometheusModule as NestPrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsMiddleware } from './metrics.middleware';
import { MetricsController } from './metrics.controller';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';


@Module({
  imports: [NestPrometheusModule.register({
    defaultMetrics: {
      enabled: true,
      config: {
        prefix: 'nestjs_api_metrics_',
      },
    },
  })],
  controllers: [MetricsController],
  providers: [MetricsMiddleware,
    {
      provide: 'PROM_METRIC_NESTJS_HTTP_REQUESTS_TOTAL',
      useFactory: (registry: Registry) => {
        const counter = new Counter({
          name: 'nestjs_http_requests_total',
          help: 'Total number of HTTP requests',
          labelNames: ['method', 'status', 'path'],
          registers: [registry],
        });
        return counter;
      },
      inject: [Registry],
    },
    {
      provide: 'PROM_METRIC_NESTJS_HTTP_REQUEST_DURATION_SECONDS',
      useFactory: (registry: Registry) => {
        const histogram = new Histogram({
          name: 'nestjs_http_request_duration_seconds',
          help: 'HTTP request duration in seconds',
          labelNames: ['method', 'status', 'path'],
          registers: [registry],
        });
        return histogram;
      },
      inject: [Registry],
    },
    Registry
  ],
})
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*'); 
  }

  constructor(private readonly registry: Registry) {
    collectDefaultMetrics({ register: this.registry });
  }

}
