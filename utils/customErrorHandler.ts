import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 500;
    let message = 'Internal server error';
    let stack: string | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || message;
      stack = exception.stack ?? null;
    } else if (exception instanceof Error) {
      message = exception.message;
      stack = exception.stack ?? null;
    }

    const responseTime = Date.now() - (request as any)['startTime'];

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      ip: request.ip || request.connection.remoteAddress,
      userAgent: request.get('User-Agent'),
      method: request.method,
      headers: request.headers,
      body: request.body,
      query: request.query,
      params: request.params,
      locale: request.headers['accept-language'] || 'en-US',
      referer: request.get('Referer') || null,
      origin: request.get('Origin') || null,
      appVersion: process.env.npm_package_version || 'unknown',
      stack,
      responseTime,
    });
  }
}
