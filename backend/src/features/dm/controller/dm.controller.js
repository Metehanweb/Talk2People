import { Controller, Delete, Get, Patch, Post, Param, Query, Body, Req, UseGuards, Dependencies, Bind } from '@nestjs/common';
import { DmService } from '../service/dm.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';

@Controller('dm')
@Dependencies(DmService)
export class DmController {
    constructor(dmService) {
        this.dmService = dmService;
    }

    @Get('conversations')
    @UseGuards(JwtAuthGuard)
    @Bind(Req())
    async getConversations(req) {
        return this.dmService.getConversations(req.user.userId);
    }

    @Get('notifications')
    @UseGuards(JwtAuthGuard)
    @Bind(Req())
    async getNotificationSummary(req) {
        return this.dmService.getNotificationSummary(req.user.userId);
    }

    @Get(':userId/messages')
    @UseGuards(JwtAuthGuard)
    @Bind(Param('userId'), Query(), Req())
    async getMessages(userId, query, req) {
        return this.dmService.getMessages(req.user.userId, userId, query);
    }

    @Post(':userId/messages')
    @UseGuards(JwtAuthGuard)
    @Bind(Param('userId'), Body(), Req())
    async sendMessage(userId, body, req) {
        return this.dmService.sendMessage(req.user.userId, userId, body.icerik);
    }

    @Patch('messages/:messageId')
    @UseGuards(JwtAuthGuard)
    @Bind(Param('messageId'), Body(), Req())
    async editMessage(messageId, body, req) {
        return this.dmService.editMessage(req.user.userId, messageId, body.icerik);
    }

    @Delete('messages/:messageId')
    @UseGuards(JwtAuthGuard)
    @Bind(Param('messageId'), Req())
    async deleteMessage(messageId, req) {
        return this.dmService.deleteMessage(req.user.userId, messageId);
    }
}
