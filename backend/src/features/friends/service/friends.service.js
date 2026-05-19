import { Injectable, Dependencies, BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FriendshipRepo } from '../repo/friendship.repo';
import { UserRepo } from '../../users/repo/user.repo';
import { successResponse, listResponse } from '../../../shared/response/response.helper';

@Injectable()
@Dependencies(FriendshipRepo, UserRepo)
export class FriendsService {
    constructor(friendshipRepo, userRepo) {
        this.friendshipRepo = friendshipRepo;
        this.userRepo = userRepo;
    }

    async searchUsers(currentUserId, query = '') {
        const q = String(query || '').trim();
        if (q.length < 2) {
            return listResponse([], { total: 0 });
        }

        const users = await this.userRepo.model
            .find({
                _id: { $ne: currentUserId },
                silindi_mi: false,
                aktif_mi: true,
                $or: [
                    { username: { $regex: q, $options: 'i' } },
                    { email: { $regex: q, $options: 'i' } },
                ],
            })
            .select('username email role')
            .limit(10);

        return listResponse(users, { total: users.length });
    }

    async getOverview(userId) {
        const [friends, incoming, outgoing] = await Promise.all([
            this.friendshipRepo.getFriends(userId),
            this.friendshipRepo.getIncomingRequests(userId),
            this.friendshipRepo.getOutgoingRequests(userId),
        ]);

        return successResponse({
            friends: friends.map(item => this.mapFriendship(item, userId)),
            incoming,
            outgoing,
        });
    }

    async sendRequest(userId, targetUserId) {
        if (!targetUserId || String(userId) === String(targetUserId)) {
            throw new BadRequestException('Geçersiz kullanıcı');
        }

        const target = await this.userRepo.findById(targetUserId);
        if (!target || target.aktif_mi === false) {
            throw new NotFoundException('Kullanıcı bulunamadı');
        }

        const existing = await this.friendshipRepo.findAnyBetween(userId, targetUserId);
        if (existing && existing.silindi_mi === false) {
            throw new ConflictException(existing.durum === 'accepted' ? 'Zaten arkadaşsınız' : 'Bekleyen arkadaşlık isteği var');
        }

        if (existing && existing.silindi_mi === true) {
            const restored = await this.friendshipRepo.patch(existing._id, {
                ad: `friend-${userId}-${targetUserId}`,
                isteyen: userId,
                hedef: targetUserId,
                durum: 'pending',
                aktif_mi: true,
                silindi_mi: false,
            });

            return successResponse(restored);
        }

        const friendship = await this.friendshipRepo.create({
            ad: `friend-${userId}-${targetUserId}`,
            isteyen: userId,
            hedef: targetUserId,
            durum: 'pending',
        });

        return successResponse(friendship);
    }

    async acceptRequest(userId, friendshipId) {
        const friendship = await this.friendshipRepo.get_one(friendshipId);
        if (!friendship) {
            throw new NotFoundException('Arkadaşlık isteği bulunamadı');
        }
        if (String(friendship.hedef) !== String(userId)) {
            throw new ForbiddenException('Bu isteği kabul edemezsiniz');
        }

        const updated = await this.friendshipRepo.patch(friendshipId, { durum: 'accepted' });
        return successResponse(updated);
    }

    async removeFriendship(userId, friendshipId) {
        const friendship = await this.friendshipRepo.get_one(friendshipId);
        if (!friendship) {
            throw new NotFoundException('Arkadaşlık kaydı bulunamadı');
        }
        if (String(friendship.isteyen) !== String(userId) && String(friendship.hedef) !== String(userId)) {
            throw new ForbiddenException('Bu arkadaşlık kaydını silemezsiniz');
        }

        await this.friendshipRepo.soft_delete(friendshipId);
        return successResponse({ message: 'Arkadaşlık kaydı kaldırıldı' });
    }

    mapFriendship(friendship, userId) {
        const otherUser = String(friendship.isteyen?._id) === String(userId)
            ? friendship.hedef
            : friendship.isteyen;

        return {
            _id: friendship._id,
            durum: friendship.durum,
            user: otherUser,
            olusturulma_tarihi: friendship.olusturulma_tarihi,
        };
    }
}
