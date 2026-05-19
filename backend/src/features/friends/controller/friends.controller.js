import { Controller, Get, Post, Delete, Param, Query, Req, UseGuards, Dependencies, Bind } from '@nestjs/common';
import { FriendsService } from '../service/friends.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';

@Controller('friends')
@Dependencies(FriendsService)
export class FriendsController {
    constructor(friendsService) {
        this.friendsService = friendsService;
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @Bind(Req())
    async getOverview(req) {
        return this.friendsService.getOverview(req.user.userId);
    }

    @Get('search')
    @UseGuards(JwtAuthGuard)
    @Bind(Query('q'), Req())
    async searchUsers(q, req) {
        return this.friendsService.searchUsers(req.user.userId, q);
    }

    @Post(':userId/request')
    @UseGuards(JwtAuthGuard)
    @Bind(Param('userId'), Req())
    async sendRequest(userId, req) {
        return this.friendsService.sendRequest(req.user.userId, userId);
    }

    @Post('requests/:id/accept')
    @UseGuards(JwtAuthGuard)
    @Bind(Param('id'), Req())
    async acceptRequest(id, req) {
        return this.friendsService.acceptRequest(req.user.userId, id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @Bind(Param('id'), Req())
    async removeFriendship(id, req) {
        return this.friendsService.removeFriendship(req.user.userId, id);
    }
}
