import { Controller, Get, UseGuards, Dependencies } from '@nestjs/common';
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
}
