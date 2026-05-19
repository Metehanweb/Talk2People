import { Controller, Get, Patch, Post, Query, Body, Param, Req, UseGuards, Dependencies, Bind } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { ROLES } from '../../shared/constants/roles.enum';

@Controller('admin')
@Dependencies(AdminService)
export class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }

    @Get('stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.ADMIN, ROLES.MODERATOR)
    async getStats() {
        return this.adminService.getStats();
    }

    @Post('reports')
    @UseGuards(JwtAuthGuard)
    @Bind(Req(), Body())
    async createReport(req, body) {
        return this.adminService.createReport(req.user, body);
    }

    @Get('reports')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.ADMIN, ROLES.MODERATOR)
    @Bind(Query())
    async getReports(query) {
        return this.adminService.getReports(query);
    }

    @Patch('reports/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.ADMIN, ROLES.MODERATOR)
    @Bind(Req(), Param('id'), Body())
    async updateReport(req, id, body) {
        return this.adminService.updateReportStatus(req.user, id, body);
    }

    @Get('logs')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.ADMIN, ROLES.MODERATOR)
    @Bind(Query())
    async getLogs(query) {
        return this.adminService.getLogs(query);
    }
}
