import { CanActivate, Injectable, Dependencies, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
@Dependencies(Reflector)
export class RolesGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }

    canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.role) {
            throw new ForbiddenException('Yetkiniz bulunmamaktadır');
        }

        const hasRole = requiredRoles.includes(user.role);
        if (!hasRole) {
            throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır');
        }

        return true;
    }
}
