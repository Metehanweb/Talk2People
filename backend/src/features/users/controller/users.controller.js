import { Controller, Get, Patch, Param, Query, Body, Req, UseGuards, Dependencies, Bind } from '@nestjs/common';
import { UsersService } from '../service/users.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { ROLES } from '../../../shared/constants/roles.enum';

@Controller('users')
@Dependencies(UsersService)
export class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.ADMIN, ROLES.MODERATOR)
    @Bind(Query())
    async getUsers(query) {
        return this.usersService.getUsers(query);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.ADMIN, ROLES.MODERATOR)
    @Bind(Param('id'))
    async getUserById(id) {
        return this.usersService.getUserById(id);
    }

    @Patch(':id/role')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.ADMIN)
    @Bind(Param('id'), Body())
    async updateUserRole(id, body) {
        return this.usersService.updateUserRole(id, body.role);
    }

    @Patch('me/profile')
    @UseGuards(JwtAuthGuard)
    @Bind(Body(), Req())
    async updateMyProfile(body, req) {
        return this.usersService.updateMyProfile(req.user.userId, body);
    }

    @Patch(':id/extra-roles')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.ADMIN)
    @Bind(Param('id'), Body())
    async updateExtraRoles(id, body) {
        return this.usersService.updateExtraRoles(id, body.extra_roles);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.ADMIN)
    @Bind(Param('id'), Body())
    async toggleUserStatus(id, body) {
        return this.usersService.toggleUserStatus(id, body.aktif_mi);
    }
}
