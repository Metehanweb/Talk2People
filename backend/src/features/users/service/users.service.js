import { Injectable, Dependencies, NotFoundException } from '@nestjs/common';
import { UserRepo } from '../repo/user.repo';
import { FriendshipRepo } from '../../friends/repo/friendship.repo';
import { ALL_EXTRA_ROLES, ALL_ROLES } from '../../../shared/constants/roles.enum';
import { successResponse, listResponse } from '../../../shared/response/response.helper';

@Injectable()
@Dependencies(UserRepo, FriendshipRepo)
export class UsersService {
    constructor(userRepo, friendshipRepo) {
        this.userRepo = userRepo;
        this.friendshipRepo = friendshipRepo;
    }

    async getUsers(query = {}) {
        const {
            page = 1,
            limit = 20,
            sortBy = 'olusturulma_tarihi',
            sortOrder = -1,
            role,
            aktif_mi,
        } = query;

        const filters = {};
        if (role) filters.role = role;
        if (aktif_mi !== undefined) filters.aktif_mi = aktif_mi === 'true';

        const result = await this.userRepo.get_many(filters, sortBy, Number(sortOrder), Number(page), Number(limit));

        return listResponse(result.data.map(user => this.withPresence(user)), {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        });
    }

    async getUserById(id) {
        const user = await this.userRepo.get_one(id);
        if (!user) {
            throw new NotFoundException('Kullanıcı bulunamadı');
        }

        const friendCount = await this.friendshipRepo.countFriends(id);
        const userObject = typeof user.toJSON === 'function' ? user.toJSON() : user;

        return successResponse({
            ...userObject,
            friendCount,
            ...this.getPresenceFields(userObject),
        });
    }

    async updateUserRole(id, newRole) {
        if (!ALL_ROLES.includes(newRole)) {
            throw new NotFoundException('Geçersiz rol: ' + newRole);
        }

        const user = await this.userRepo.get_one(id);
        if (!user) {
            throw new NotFoundException('Kullanıcı bulunamadı');
        }

        const updated = await this.userRepo.patch(id, { role: newRole });
        return successResponse(updated);
    }

    async toggleUserStatus(id, aktif_mi) {
        const user = await this.userRepo.get_one(id);
        if (!user) {
            throw new NotFoundException('Kullanıcı bulunamadı');
        }

        const updated = await this.userRepo.patch(id, { aktif_mi });
        return successResponse(updated);
    }

    async updateExtraRoles(id, extraRoles = []) {
        const user = await this.userRepo.get_one(id);
        if (!user) {
            throw new NotFoundException('Kullanici bulunamadi');
        }

        const roles = Array.isArray(extraRoles) ? extraRoles : [];
        const safeRoles = [...new Set(roles.filter(role => ALL_EXTRA_ROLES.includes(role)))];
        const updated = await this.userRepo.patch(id, { extra_roles: safeRoles });
        return successResponse(updated);
    }

    async updateMyProfile(userId, body = {}) {
        const updates = {};

        if (typeof body.profil_fotografi_url === 'string') {
            updates.profil_fotografi_url = body.profil_fotografi_url.trim().slice(0, 500);
        }

        if (body.durum_modu && ['online', 'idle', 'dnd', 'invisible'].includes(body.durum_modu)) {
            updates.durum_modu = body.durum_modu;
        }

        const updated = await this.userRepo.patch(userId, updates);
        return successResponse(this.withPresence(updated));
    }

    withPresence(user) {
        const userObject = typeof user.toJSON === 'function' ? user.toJSON() : user;
        return {
            ...userObject,
            ...this.getPresenceFields(userObject),
        };
    }

    getPresenceFields(user) {
        const lastSeen = user.son_cevrimici_tarihi || null;
        const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;

        return {
            son_cevrimici_tarihi: lastSeen,
            cevrimici_mi: user.aktif_mi !== false && user.durum_modu !== 'invisible' && lastSeenTime > 0 && Date.now() - lastSeenTime < 60000,
        };
    }
}
