import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Resposta de erro padronizada (escopo 17.01): código estável, mensagem,
 * caminho e correlação. Mantém o contrato consistente para web, app e parceiros.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let mensagem: string | string[] = 'Erro interno do servidor';
    let codigo = 'erro_interno';

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        mensagem = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        mensagem = (body.message as string | string[]) ?? exception.message;
        codigo = (body.error as string) ?? codigo;
      }
      codigo = HttpStatus[status]?.toLowerCase() ?? codigo;
    } else {
      this.logger.error(exception);
    }

    response.status(status).json({
      sucesso: false,
      statusCode: status,
      codigo,
      mensagem,
      caminho: request.url,
      correlacao: (request.headers['x-request-id'] as string) ?? undefined,
      timestamp: new Date().toISOString(),
    });
  }
}
