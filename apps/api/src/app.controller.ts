import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Sistema')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({ summary: 'Liveness/health check' })
  health() {
    return { status: 'ok', servico: 'alpha-hub-api', timestamp: new Date().toISOString() };
  }
}
