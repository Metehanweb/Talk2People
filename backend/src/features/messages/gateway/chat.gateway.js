import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { UseGuards, Dependencies, Bind } from '@nestjs/common';
import { WsJwtGuard } from '../../../shared/guards/ws-jwt.guard';
import { MessagesService } from '../service/messages.service';
import { ChannelsService } from '../../channels/service/channels.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
@Dependencies(MessagesService, ChannelsService)
export class ChatGateway {
    @WebSocketServer()
    server;

    constructor(messagesService, channelsService) {
        this.messagesService = messagesService;
        this.channelsService = channelsService;
    }

    handleConnection(client) {
        console.log(`Client bağlandı: ${client.id}`);
    }

    handleDisconnect(client) {
        console.log(`Client ayrıldı: ${client.id}`);
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('join_channel')
    @Bind(ConnectedSocket(), MessageBody())
    async handleJoinChannel(client, data) {
        const channelId = typeof data === 'object' ? data.channelId : data;
        await this.channelsService.validateChannelAccess(channelId, client.user, data || {});
        client.join(channelId);
        console.log(`Client ${client.id}, ${channelId} odasına katıldı.`);
    }

    @SubscribeMessage('leave_channel')
    @Bind(ConnectedSocket(), MessageBody())
    handleLeaveChannel(client, channelId) {
        client.leave(channelId);
        console.log(`Client ${client.id}, ${channelId} odasından ayrıldı.`);
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('send_message')
    @Bind(ConnectedSocket(), MessageBody())
    async handleMessage(client, data) {
        const { channelId, icerik, alintiId } = data;
        
        // Mesajı veritabanına kaydet
        const result = await this.messagesService.sendMessage(channelId, icerik, client.user, alintiId, data);
        
        // Odaya (kanala) yeni mesajı yayınla
        this.server.to(channelId).emit('new_message', result.data);
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('typing_channel')
    @Bind(ConnectedSocket(), MessageBody())
    async handleTyping(client, data) {
        const { channelId, isTyping } = data;
        await this.channelsService.validateChannelAccess(channelId, client.user, data || {});
        client.to(channelId).emit('channel_typing', {
            channelId,
            userId: client.user.userId,
            username: client.user.username || client.user.email,
            isTyping: Boolean(isTyping),
        });
    }
}
