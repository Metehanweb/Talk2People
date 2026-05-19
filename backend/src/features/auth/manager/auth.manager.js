import { Injectable, Dependencies, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserRepo } from '../../users/repo/user.repo';
import { AuthService } from '../service/auth.service';
import { successResponse } from '../../../shared/response/response.helper';

@Injectable()
@Dependencies(UserRepo, AuthService)
export class AuthManager {
    constructor(userRepo, authService) {
        this.userRepo = userRepo;
        this.authService = authService;
    }

    async register(registerDto) {
        const emailExists = await this.userRepo.existsByEmail(registerDto.email);
        if (emailExists) {
            throw new ConflictException('Bu email adresi zaten kayıtlı');
        }

        const hashedPassword = await this.authService.hashPassword(registerDto.password);

        const user = await this.userRepo.create({
            ad: registerDto.username,
            email: registerDto.email,
            password: hashedPassword,
            username: registerDto.username,
            son_cevrimici_tarihi: new Date(),
        });

        const accessToken = this.authService.generateToken(user);

        return successResponse({
            user: user.toJSON(),
            accessToken,
        });
    }

    async login(loginDto) {
        const user = await this.userRepo.findByEmail(loginDto.email);
        if (!user) {
            throw new UnauthorizedException('Email veya şifre hatalı');
        }

        const isPasswordValid = await this.authService.comparePassword(
            loginDto.password,
            user.password,
        );
        if (!isPasswordValid) {
            throw new UnauthorizedException('Email veya şifre hatalı');
        }

        if (user.aktif_mi === false) {
            throw new UnauthorizedException('Hesabınız askıya alınmıştır. Lütfen yönetici ile iletişime geçin.');
        }

        user.son_cevrimici_tarihi = new Date();
        await user.save();

        const accessToken = this.authService.generateToken(user);

        return successResponse({
            user: user.toJSON(),
            accessToken,
        });
    }

    async getMe(userId) {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new UnauthorizedException('Kullanıcı bulunamadı');
        }

        return successResponse({ user });
    }

    async touch(userId) {
        const user = await this.userRepo.patch(userId, { son_cevrimici_tarihi: new Date() });
        if (!user) {
            throw new UnauthorizedException('Kullanıcı bulunamadı');
        }

        return successResponse({ ok: true });
    }
}
