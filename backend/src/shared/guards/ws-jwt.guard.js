import { Injectable, Dependencies } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AuthService } from '../../features/auth/service/auth.service';

@Injectable()
@Dependencies(AuthService)
export class WsJwtGuard {
    constructor(authService) {
        this.authService = authService;
    }

    async canActivate(context) {
        try {
            const client = context.switchToWs().getClient();
            // Token auth objesinde veya header'da olabilir
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

            if (!token) {
                throw new WsException('Yetkisiz erişim - Token bulunamadı');
            }

            const { user } = await this.authService.getUserFromToken(token);

            if (!user) {
                throw new WsException('Yetkisiz erişim - Kullanıcı bulunamadı');
            }

            if (user.aktif_mi === false) {
                throw new WsException('Yetkisiz erişim - Kullanıcı banlanmış');
            }
            
            // Client nesnesine user bilgisini ekliyoruz
            client.user = {
                userId: user._id,
                email: user.email,
                role: user.role,
            };

            return true;
        } catch (err) {
            if (err instanceof WsException) {
                throw err;
            }
            throw new WsException('Geçersiz veya süresi dolmuş token');
        }
    }
}
