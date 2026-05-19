import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards, Dependencies, Bind } from '@nestjs/common';
import { ChannelsService } from '../service/channels.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { ROLES } from '../../../shared/constants/roles.enum';

@Controller('channels')
@Dependencies(ChannelsService)
export class ChannelsController {
    constructor(channelsService) {
        this.channelsService = channelsService;
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.ADMIN, ROLES.MODERATOR)
    @Bind(Body(), Req())
    async createChannel(body, req) {
        return this.channelsService.createChannel(body, req.user.userId);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @Bind(Query())
    async getChannels(query) {
        return this.channelsService.getChannels(query);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @Bind(Param('id'), Query(), Req())
    async getChannelById(id, query, req) {
        return this.channelsService.getChannelById(id, req.user, query);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.ADMIN, ROLES.MODERATOR)
    @Bind(Param('id'), Body())
    async updateChannel(id, body) {
        return this.channelsService.updateChannel(id, body);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(ROLES.ADMIN)
    @Bind(Param('id'))
    async deleteChannel(id) {
        return this.channelsService.deleteChannel(id);
    }
}
