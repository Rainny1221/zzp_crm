import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Counter, Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly counter: Counter<string>,

    @InjectMetric('http_request_duration_seconds')
    private readonly histogram: Histogram<string>,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const end = this.histogram.startTimer();

    if (req.path === '/metrics') {
      return next();
    }

    res.on('finish', () => {
      const path = req.route?.path ?? req.path.replace(/\/\d+/g, '/:id');

      const labels = {
        method: req.method,
        status: String(res.statusCode),
        path,
      };

      this.counter.inc(labels);
      end(labels);
    });

    next();
  }
}
