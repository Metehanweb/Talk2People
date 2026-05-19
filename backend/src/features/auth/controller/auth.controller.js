import { Controller, Dependencies, Post, Get, Body, UseGuards, Req, HttpCode, Bind } from '@nestjs/common';
import { AuthManager } from '../manager/auth.manager';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';


@Controller('auth')
@Dependencies(AuthManager)
export class AuthController {
    constructor(authManager) {
        this.authManager = authManager;
    }


    @Post('register')
    @HttpCode(201)
    @Bind(Body())
    async register(registerDto) {
        return this.authManager.register(registerDto);
    }


    @Post('login')
    @HttpCode(200)
    @Bind(Body())
    async login(loginDto) {
        return this.authManager.login(loginDto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @Bind(Req())
    async getMe(req) {
        return this.authManager.getMe(req.user.userId);
    }

    @Post('touch')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    @Bind(Req())
    async touch(req) {
        return this.authManager.touch(req.user.userId);
    }
}
