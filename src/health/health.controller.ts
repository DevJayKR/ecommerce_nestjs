import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly typeOrmHealthCheckIndicator: TypeOrmHealthIndicator,
    private readonly memoryHealthCheckIndicator: MemoryHealthIndicator,
    private readonly diskHealthIndicator: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.healthCheckService.check([
      () => this.typeOrmHealthCheckIndicator.pingCheck('database'),
      () =>
        this.memoryHealthCheckIndicator.checkHeap(
          'memory heap',
          300 * 1024 * 1024,
        ),

      () =>
        this.memoryHealthCheckIndicator.checkRSS(
          'memory RSS',
          300 * 1024 * 1024,
        ),

      () =>
        this.diskHealthIndicator.checkStorage('disk health', {
          thresholdPercent: 0.5,
          path: '/',
        }),
    ]);
  }
}
