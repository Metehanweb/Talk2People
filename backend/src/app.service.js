import { Injectable } from '@nestjs/common';
const { successResponse } = require('./shared/response/response.helper');

@Injectable()
export class AppService {
  getHealth() {
    return successResponse({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }
}
