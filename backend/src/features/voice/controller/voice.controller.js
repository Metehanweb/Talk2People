import { Controller, Get, Post, Delete, Patch, Param, Body, Req, UseGuards, Dependencies, Bind } from '@nestjs/common';
import { VoiceService } from '../service/voice.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';

@Controller('channels/:channelId/voice')
@Dependencies(VoiceService)
export class VoiceController {
    constructor(voiceService) {
        this.voiceService = voiceService;
    }

    // Kanaldaki aktif katılımcıları listele
    @Get('participants')
    @UseGuards(JwtAuthGuard)
    @Bind(Param('channelId'))
    async getParticipants(channelId) {
        return this.voiceService.getParticipants(channelId);
    }

    // Kanala katıl
    @Post('join')
    @UseGuards(JwtAuthGuard)
    @Bind(Param('channelId'), Body(), Req())
    async join(channelId, body, req) {
        return this.voiceService.joinChannel(channelId, req.user, body);
    }

    // Kanaldan ayrıl
    @Delete('leave')
    @UseGuards(JwtAuthGuard)
    @Bind(Param('channelId'), Req())
    async leave(channelId, req) {
        return this.voiceService.leaveChannel(channelId, req.user.userId);
    }

    // Durumu güncelle (mute/deafen)
    @Patch('status')
    @UseGuards(JwtAuthGuard)
    @Bind(Param('channelId'), Body(), Req())
    async updateStatus(channelId, body, req) {
        return this.voiceService.updateStatus(channelId, req.user.userId, body);
    }
}
