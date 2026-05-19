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
    @Bind(Param('id'), Body(), Req())
    async updateUserRole(id, body, req) {
        return this.usersService.updateUserRole(id, body.role, req.user);
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
    @Bind(Param('id'), Body(), Req())
    async updateExtraRoles(id, body, req) {
        return this.usersService.updateExtraRoles(id, body.extra_roles, req.user);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.ADMIN)
    @Bind(Param('id'), Body(), Req())
    async toggleUserStatus(id, body, req) {
        return this.usersService.toggleUserStatus(id, body.aktif_mi, req.user);
    }

    @Get('me/blocked')
    @UseGuards(JwtAuthGuard)
    @Bind(Req())
    async getBlockedUsers(req) {
        return this.usersService.getBlockedUsers(req.user.userId);
    }

    @Patch(':id/block')
    @UseGuards(JwtAuthGuard)
    @Bind(Param('id'), Req())
    async blockUser(id, req) {
        return this.usersService.blockUser(req.user.userId, id);
    }

    @Patch(':id/unblock')
    @UseGuards(JwtAuthGuard)
    @Bind(Param('id'), Req())
    async unblockUser(id, req) {
        return this.usersService.unblockUser(req.user.userId, id);
    }
}
