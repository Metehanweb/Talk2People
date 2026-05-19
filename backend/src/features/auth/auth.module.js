import { Module, forwardRef } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthService } from './service/auth.service';
import { AuthManager } from './manager/auth.manager';
import { AuthController } from './controller/auth.controller';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { WsJwtGuard } from '../../shared/guards/ws-jwt.guard';


@Module({
    imports: [forwardRef(() => UsersModule)],
    providers: [AuthService, AuthManager, JwtAuthGuard, WsJwtGuard],
    controllers: [AuthController],
    exports: [AuthService, JwtAuthGuard, WsJwtGuard],
})
export class AuthModule { }
