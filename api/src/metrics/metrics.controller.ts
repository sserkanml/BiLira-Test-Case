import { Controller, Get, Header } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Registry } from 'prom-client';

@Controller('metrics')
export class MetricsController {
  constructor(
    private readonly registry: Registry,
    @InjectMetric('nestjs_http_requests_total') private readonly httpRequestsTotal,
    @InjectMetric('nestjs_http_request_duration_seconds') private readonly httpRequestDuration,
  ) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
