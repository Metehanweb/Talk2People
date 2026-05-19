import { BadRequestException, Injectable, Dependencies, NotFoundException } from '@nestjs/common';
import { MessageRepo } from '../repo/message.repo';
import { ChannelsService } from '../../channels/service/channels.service';
import { successResponse, listResponse } from '../../../shared/response/response.helper';

@Injectable()
@Dependencies(MessageRepo, ChannelsService)
export class MessagesService {
    constructor(messageRepo, channelsService) {
        this.messageRepo = messageRepo;
        this.channelsService = channelsService;
    }

    async sendMessage(channelId, icerik, user, alintiId = null, options = {}) {
        await this.channelsService.validateChannelAccess(channelId, user, options);

        const payload = {
            icerik,
            kanal: channelId,
            gonderen: user.userId,
            ad: icerik.substring(0, 50),
        };
        if (alintiId) {
            payload.alinti_yapilan_mesaj = alintiId;
        }

        const message = await this.messageRepo.create(payload);
        
        // Populate sender before returning so WebSocket clients have user details
        const populatedMessage = await this.messageRepo.model.findById(message._id)
            .populate('gonderen', 'username email role extra_roles profil_fotografi_url durum_modu')
            .populate({
                path: 'alinti_yapilan_mesaj',
                populate: { path: 'gonderen', select: 'username' }
            });
        
        return successResponse(populatedMessage);
    }

    async getMessages(channelId, query = {}, user = null) {
        const { page = 1, limit = 30 } = query;
        if (user) {
            await this.channelsService.validateChannelAccess(channelId, user, query);
        }
        const result = await this.messageRepo.getByChannel(channelId, Number(page), Number(limit));

        return listResponse(result.data, {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        });
    }

    async deleteMessage(channelId, messageId, user) {
        await this.channelsService.validateChannelAccess(channelId, user, {});
        const message = await this.messageRepo.get_one(messageId);
        if (!message) {
            throw new NotFoundException('Mesaj bulunamadı');
        }

        await this.messageRepo.soft_delete(messageId);
        return successResponse({ message: 'Mesaj silindi' });
    }

    async editMessage(channelId, messageId, user, content) {
        await this.channelsService.validateChannelAccess(channelId, user, {});
        const message = await this.messageRepo.get_one(messageId);
        if (!message) {
            throw new NotFoundException('Mesaj bulunamadi');
        }

        const text = String(content || '').trim();
        if (!text) {
            throw new BadRequestException('Mesaj bos olamaz');
        }

        const updated = await this.messageRepo.patch(messageId, {
            icerik: text.slice(0, 2000),
            duzenlendi_mi: true,
            duzenlenme_tarihi: new Date(),
        });

        const populated = await this.messageRepo.model.findById(updated._id)
            .populate('gonderen', 'username email role extra_roles profil_fotografi_url durum_modu')
            .populate({
                path: 'alinti_yapilan_mesaj',
                populate: { path: 'gonderen', select: 'username' }
            });

        return successResponse(populated);
    }

    async toggleReaction(messageId, userId, emoji) {
        const message = await this.messageRepo.get_one(messageId);
        if (!message) {
            throw new NotFoundException('Mesaj bulunamadı');
        }

        if (!message.tepkiler) {
            message.tepkiler = [];
        }

        const reactionIndex = message.tepkiler.findIndex(r => r.emoji === emoji);
        if (reactionIndex > -1) {
            const users = message.tepkiler[reactionIndex].kullanicilar.map(id => id.toString());
            const userIndex = users.indexOf(userId);

            if (userIndex > -1) {
                // Remove user from reaction
                message.tepkiler[reactionIndex].kullanicilar.splice(userIndex, 1);
                // If no users left, remove the emoji entirely
                if (message.tepkiler[reactionIndex].kullanicilar.length === 0) {
                    message.tepkiler.splice(reactionIndex, 1);
                }
            } else {
                // Add user to reaction
                message.tepkiler[reactionIndex].kullanicilar.push(userId);
            }
        } else {
            // New reaction emoji
            message.tepkiler.push({
                emoji,
                kullanicilar: [userId]
            });
        }

        await message.save();

        return successResponse({ tepkiler: message.tepkiler });
    }
}
