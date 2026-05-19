import { CanActivate, Injectable, Dependencies, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from '../../features/auth/service/auth.service';


@Injectable()
@Dependencies(AuthService)
export class JwtAuthGuard {
    constructor(authService) {
        this.authService = authService;
    }

    async canActivate(context) {
        const request = context.switchToHttp().getRequest();

        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Token bulunamadı');
        }

        const token = authHeader.split(' ')[1];

        try {
            const { user } = await this.authService.getUserFromToken(token);

            if (!user) {
                throw new UnauthorizedException('Kullanıcı bulunamadı');
            }

            if (user.aktif_mi === false) {
                throw new ForbiddenException('Kullanıcı banlanmış');
            }

            request.user = {
                userId: user._id,
                email: user.email,
                role: user.role,
            };

            return true;
        } catch (error) {
            if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
                throw error;
            }
            throw new UnauthorizedException('Geçersiz veya süresi dolmuş token');
        }
    }
}
