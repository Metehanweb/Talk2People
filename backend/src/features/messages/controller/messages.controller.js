import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards, Dependencies, Bind } from '@nestjs/common';
import { MessagesService } from '../service/messages.service';
import { ChatGateway } from '../gateway/chat.gateway';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';

@Controller('channels/:channelId/messages')
@Dependencies(MessagesService, ChatGateway)
export class MessagesController {
    constructor(messagesService, chatGateway) {
        this.messagesService = messagesService;
        this.chatGateway = chatGateway;
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @Bind(Param('channelId'), Body(), Req())
    async sendMessage(channelId, body, req) {
        return this.messagesService.sendMessage(channelId, body.icerik, req.user, body.alintiId, body);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @Bind(Param('channelId'), Query(), Req())
    async getMessages(channelId, query, req) {
        return this.messagesService.getMessages(channelId, query, req.user);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @Bind(Param('channelId'), Param('id'), Req())
    async deleteMessage(channelId, id, req) {
        const result = await this.messagesService.deleteMessage(channelId, id, req.user);
        
        // Silme işlemini odaya bildir (canlı güncelleme)
        if (this.chatGateway && this.chatGateway.server) {
            this.chatGateway.server.to(channelId).emit('message_deleted', { messageId: id, channelId });
        }
        
        return result;
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @Bind(Param('channelId'), Param('id'), Body(), Req())
    async editMessage(channelId, id, body, req) {
        const result = await this.messagesService.editMessage(channelId, id, req.user, body.icerik);

        if (this.chatGateway && this.chatGateway.server) {
            this.chatGateway.server.to(channelId).emit('message_updated', {
                messageId: id,
                channelId,
                message: result.data,
            });
        }

        return result;
    }

    @Post(':id/react')
    @UseGuards(JwtAuthGuard)
    @Bind(Param('channelId'), Param('id'), Body(), Req())
    async reactToMessage(channelId, id, body, req) {
        const { emoji } = body;
        const result = await this.messagesService.toggleReaction(id, req.user.userId, emoji);
        
        if (this.chatGateway && this.chatGateway.server) {
            this.chatGateway.server.to(channelId).emit('message_reaction_updated', {
                messageId: id,
                channelId,
                tepkiler: result.data.tepkiler
            });
        }

        return result;
    }
}
