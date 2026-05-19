import { Catch, HttpException, HttpStatus } from '@nestjs/common';

/**
 * HttpExceptionFilter — Merkezi hata yakalama filtresi.
 *
 * Tüm HTTP hatalarını standart formatta döner:
 * { success: false, message, code, details? }
 *
 * Bilinmeyen hatalar 500 INTERNAL_SERVER_ERROR olarak döner.
 */
@Catch()
export class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        // HTTP durumu belirle
        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        // Hata detaylarını çıkar
        const exceptionResponse =
            exception instanceof HttpException
                ? exception.getResponse()
                : null;

        // Mesajı belirle (string veya object olabilir)
        let message = 'Internal server error';
        let details = null;

        if (typeof exceptionResponse === 'string') {
            message = exceptionResponse;
        } else if (exceptionResponse && typeof exceptionResponse === 'object') {
            message = exceptionResponse.message || exceptionResponse.error || message;
            // class-validator hataları array olarak gelir
            if (Array.isArray(exceptionResponse.message)) {
                details = exceptionResponse.message;
                message = 'Validation failed';
            }
        }

        // Hata kodu belirle
        const code = HttpExceptionFilter.getErrorCode(status);

        // Konsola logla (development için)
        console.error(`[HttpExceptionFilter] ${status} ${code}: ${message}`, {
            path: request.url,
            method: request.method,
            timestamp: new Date().toISOString(),
        });

        // Standart hata response döndür
        const errorResponse = {
            success: false,
            message,
            code,
        };

        // details varsa ekle
        if (details) {
            errorResponse.details = details;
        }

        response.status(status).json(errorResponse);
    }

    /**
     * HTTP durum kodundan anlamlı hata kodu üretir.
     */
    static getErrorCode(status) {
        const codeMap = {
            [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
            [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
            [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
            [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
            [HttpStatus.CONFLICT]: 'CONFLICT',
            [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
            [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
        };

        return codeMap[status] || 'UNKNOWN_ERROR';
    }
}
