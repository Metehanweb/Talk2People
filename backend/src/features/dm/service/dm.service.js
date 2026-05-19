import { Injectable, Dependencies, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DirectMessageRepo } from '../repo/direct-message.repo';
import { FriendshipRepo } from '../../friends/repo/friendship.repo';
import { UserRepo } from '../../users/repo/user.repo';
import { UserBlockRepo } from '../../users/repo/user-block.repo';
import { successResponse, listResponse } from '../../../shared/response/response.helper';

@Injectable()
@Dependencies(DirectMessageRepo, FriendshipRepo, UserRepo, UserBlockRepo)
export class DmService {
    constructor(directMessageRepo, friendshipRepo, userRepo, userBlockRepo) {
        this.directMessageRepo = directMessageRepo;
        this.friendshipRepo = friendshipRepo;
        this.userRepo = userRepo;
        this.userBlockRepo = userBlockRepo;
    }

    async getConversations(userId) {
        const friendships = await this.friendshipRepo.getFriends(userId);
        const conversations = await Promise.all(friendships.map(async (friendship) => {
            const friend = String(friendship.isteyen?._id) === String(userId)
                ? friendship.hedef
                : friendship.isteyen;
            const latestMessage = await this.directMessageRepo.getLatestBetween(userId, friend._id);
            const unreadCount = await this.directMessageRepo.countUnreadBetween(userId, friend._id);

            return {
                friendshipId: friendship._id,
                user: friend,
                latestMessage,
                unreadCount,
                updatedAt: latestMessage?.olusturulma_tarihi || friendship.degistirilme_tarihi || friendship.olusturulma_tarihi,
            };
        }));

        conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return listResponse(conversations, { total: conversations.length });
    }

    async getMessages(userId, targetUserId, query = {}) {
        const target = await this.ensureCanMessage(userId, targetUserId);
        await this.directMessageRepo.markConversationRead(userId, targetUserId);
        const result = await this.directMessageRepo.getConversation(userId, targetUserId, query.page, query.limit);

        return successResponse({
            user: target,
            messages: result.data,
            meta: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
        });
    }

    async sendMessage(userId, targetUserId, content) {
        await this.ensureCanMessage(userId, targetUserId);
        const text = String(content || '').trim();
        if (!text) {
            throw new BadRequestException('Mesaj boş olamaz');
        }
        if (text.length > 2000) {
            throw new BadRequestException('Mesaj 2000 karakterden uzun olamaz');
        }

        const message = await this.directMessageRepo.create({
            ad: `dm-${userId}-${targetUserId}`,
            gonderen: userId,
            alici: targetUserId,
            icerik: text,
        });

        const populated = await this.directMessageRepo.model
            .findById(message._id)
            .populate('gonderen', 'username email role extra_roles profil_fotografi_url durum_modu')
            .populate('alici', 'username email role extra_roles profil_fotografi_url durum_modu');

        return successResponse(populated);
    }

    async editMessage(userId, messageId, content) {
        const message = await this.directMessageRepo.get_one(messageId);
        if (!message || message.silindi_mi) {
            throw new NotFoundException('Mesaj bulunamadi');
        }

        if (!this.isConversationParticipant(message, userId)) {
            throw new ForbiddenException('Bu mesaji duzenleme yetkiniz yok');
        }

        const text = String(content || '').trim();
        if (!text) {
            throw new BadRequestException('Mesaj bos olamaz');
        }

        const updated = await this.directMessageRepo.patch(messageId, {
            icerik: text.slice(0, 2000),
            duzenlendi_mi: true,
            duzenlenme_tarihi: new Date(),
        });

        const populated = await this.directMessageRepo.model
            .findById(updated._id)
            .populate('gonderen', 'username email role extra_roles profil_fotografi_url durum_modu')
            .populate('alici', 'username email role extra_roles profil_fotografi_url durum_modu');

        return successResponse(populated);
    }

    async deleteMessage(userId, messageId) {
        const message = await this.directMessageRepo.get_one(messageId);
        if (!message || message.silindi_mi) {
            throw new NotFoundException('Mesaj bulunamadi');
        }

        if (!this.isConversationParticipant(message, userId)) {
            throw new ForbiddenException('Bu mesaji silme yetkiniz yok');
        }

        await this.directMessageRepo.soft_delete(messageId);
        return successResponse({ message: 'Mesaj silindi' });
    }

    async getNotificationSummary(userId) {
        const unreadDmCount = await this.directMessageRepo.countUnreadForUser(userId);
        const incomingRequests = await this.friendshipRepo.getIncomingRequests(userId);

        return successResponse({
            unreadDmCount,
            incomingFriendRequestCount: incomingRequests.length,
            total: unreadDmCount + incomingRequests.length,
        });
    }

    async ensureCanMessage(userId, targetUserId) {
        if (!targetUserId || String(userId) === String(targetUserId)) {
            throw new BadRequestException('Geçersiz kullanıcı');
        }

        const target = await this.userRepo.findById(targetUserId);
        if (!target || target.aktif_mi === false) {
            throw new NotFoundException('Kullanıcı bulunamadı');
        }

        const friendship = await this.friendshipRepo.findBetween(userId, targetUserId);
        if (!friendship || friendship.durum !== 'accepted') {
            throw new ForbiddenException('Özel mesaj göndermek için arkadaş olmalısınız');
        }

        const block = await this.userBlockRepo.findBetween(userId, targetUserId);
        if (block) {
            throw new ForbiddenException('Bu kullanici ile mesajlasamazsiniz');
        }

        return target;
    }

    isConversationParticipant(message, userId) {
        return String(message.gonderen) === String(userId) || String(message.alici) === String(userId);
    }
}
