import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  private readonly logger = new Logger('MetricsMiddleware');

  constructor(
    @Inject('PROM_METRIC_NESTJS_HTTP_REQUESTS_TOTAL') private readonly httpRequestsTotal: Counter<string>,
    @Inject('PROM_METRIC_NESTJS_HTTP_REQUEST_DURATION_SECONDS') private readonly httpRequestDuration: Histogram<string>,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = process.hrtime();

    res.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds + nanoseconds / 1e9;
      const path = req.route?.path || req.path || 'unknown';

      this.httpRequestsTotal.inc({
        method: req.method,
        status: res.statusCode.toString(),
        path: path,
      });

      this.httpRequestDuration.observe(
        {
          method: req.method,
          status: res.statusCode.toString(),
          path: path,
        },
        duration,
      );

      this.logger.log(`Metric recorded: ${req.method} ${path} ${res.statusCode} in ${duration}s`);
    });

    next();
  }
}
