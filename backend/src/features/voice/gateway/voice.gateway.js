import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { UseGuards, Bind, Dependencies } from '@nestjs/common';
import { WsJwtGuard } from '../../../shared/guards/ws-jwt.guard';
import { VoiceService } from '../service/voice.service';
import { ChannelsService } from '../../channels/service/channels.service';
import { DmService } from '../../dm/service/dm.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
@Dependencies(VoiceService, ChannelsService, DmService)
export class VoiceGateway {
    constructor(voiceService, channelsService, dmService) {
        this.voiceService = voiceService;
        this.channelsService = channelsService;
        this.dmService = dmService;
        this.activeConnections = new Map(); // socketId -> { channelId, userId }
        this.activeDmConnections = new Map(); // socketId -> { roomName, targetUserId, userId }
    }

    @WebSocketServer()
    server;

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('join_voice')
    @Bind(ConnectedSocket(), MessageBody())
    async handleJoinVoice(client, data) {
        const { channelId, user } = data;
        await this.channelsService.validateChannelAccess(channelId, client.user, data || {});
        const roomName = `voice_${channelId}`;
        client.join(roomName);
        
        // Track the connection to handle unexpected disconnects
        this.activeConnections.set(client.id, { channelId, userId: client.user.userId });

        // Diğerlerine yeni katılan kişiyi haber ver
        client.to(roomName).emit('user_joined_voice', {
            socketId: client.id,
            userId: client.user.userId,
            user
        });
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('voice_signal')
    @Bind(ConnectedSocket(), MessageBody())
    handleVoiceSignal(client, data) {
        // Hedef kullanıcıya (targetSocketId) WebRTC sinyalini (offer/answer/candidate) gönder
        const { targetSocketId, signal } = data;
        
        this.server.to(targetSocketId).emit('voice_signal', {
            signal,
            callerId: client.id,
            callerUserId: client.user?.userId
        });
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('join_dm_voice')
    @Bind(ConnectedSocket(), MessageBody())
    async handleJoinDmVoice(client, data) {
        const { targetUserId, user } = data;
        await this.dmService.ensureCanMessage(client.user.userId, targetUserId);

        const roomName = this.getDmVoiceRoomName(client.user.userId, targetUserId);
        client.join(roomName);
        this.activeDmConnections.set(client.id, {
            roomName,
            targetUserId,
            userId: client.user.userId,
        });

        client.to(roomName).emit('user_joined_voice', {
            socketId: client.id,
            userId: client.user.userId,
            user,
        });
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('leave_dm_voice')
    @Bind(ConnectedSocket())
    handleLeaveDmVoice(client) {
        const conn = this.activeDmConnections.get(client.id);
        if (!conn) return;

        client.leave(conn.roomName);
        this.activeDmConnections.delete(client.id);
        client.to(conn.roomName).emit('user_left_voice', {
            socketId: client.id,
            userId: client.user.userId,
        });
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('leave_voice')
    @Bind(ConnectedSocket(), MessageBody())
    handleLeaveVoice(client, channelId) {
        const roomName = `voice_${channelId}`;
        client.leave(roomName);
        this.activeConnections.delete(client.id);
        
        client.to(roomName).emit('user_left_voice', { 
            socketId: client.id, 
            userId: client.user.userId 
        });
    }
    
    // Disconnect olduğunda da odalardan çıkış yapmasını sağlamalıyız
    async handleDisconnect(client) {
        const conn = this.activeConnections.get(client.id);
        if (conn) {
            try {
                // Veritabanında oturumu kapat
                await this.voiceService.leaveChannel(conn.channelId, conn.userId);
            } catch (err) {
                // Ignore if already left
            }
            // Odadaki diğer kişilere kullanıcının ayrıldığını haber ver
            this.server.to(`voice_${conn.channelId}`).emit('user_left_voice', { 
                socketId: client.id, 
                userId: conn.userId 
            });
            this.activeConnections.delete(client.id);
        }

        const dmConn = this.activeDmConnections.get(client.id);
        if (dmConn) {
            this.server.to(dmConn.roomName).emit('user_left_voice', {
                socketId: client.id,
                userId: dmConn.userId,
            });
            this.activeDmConnections.delete(client.id);
        }
    }

    getDmVoiceRoomName(userA, userB) {
        return `dm_voice_${[String(userA), String(userB)].sort().join('_')}`;
    }
}
