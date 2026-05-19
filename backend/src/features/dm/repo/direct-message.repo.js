import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { BaseRepo } from '../../../base/BaseRepo';
import { DIRECT_MESSAGE_MODEL_NAME } from '../model/direct-message.model';

@Injectable()
@Dependencies(getModelToken(DIRECT_MESSAGE_MODEL_NAME))
export class DirectMessageRepo extends BaseRepo {
    constructor(directMessageModel) {
        super(directMessageModel);
    }

    async getConversation(userA, userB, page = 1, limit = 50) {
        const safePage = Math.max(Number(page) || 1, 1);
        const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
        const skip = (safePage - 1) * safeLimit;
        const filters = {
            silindi_mi: false,
            $or: [
                { gonderen: userA, alici: userB },
                { gonderen: userB, alici: userA },
            ],
        };

        const [data, total] = await Promise.all([
            this.model
                .find(filters)
                .populate('gonderen', 'username email role extra_roles profil_fotografi_url durum_modu')
                .populate('alici', 'username email role extra_roles profil_fotografi_url durum_modu')
                .sort({ olusturulma_tarihi: -1 })
                .skip(skip)
                .limit(safeLimit),
            this.model.countDocuments(filters),
        ]);

        return {
            data: data.reverse(),
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(total / safeLimit),
        };
    }

    async getLatestBetween(userA, userB) {
        return this.model
            .findOne({
                silindi_mi: false,
                $or: [
                    { gonderen: userA, alici: userB },
                    { gonderen: userB, alici: userA },
                ],
            })
            .populate('gonderen', 'username email role extra_roles profil_fotografi_url durum_modu')
            .populate('alici', 'username email role extra_roles profil_fotografi_url durum_modu')
            .sort({ olusturulma_tarihi: -1 });
    }

    async countUnreadForUser(userId) {
        return this.model.countDocuments({
            alici: userId,
            okundu_mu: false,
            silindi_mi: false,
        });
    }

    async countUnreadBetween(userId, friendId) {
        return this.model.countDocuments({
            gonderen: friendId,
            alici: userId,
            okundu_mu: false,
            silindi_mi: false,
        });
    }

    async markConversationRead(userId, friendId) {
        return this.model.updateMany(
            {
                gonderen: friendId,
                alici: userId,
                okundu_mu: false,
                silindi_mi: false,
            },
            { $set: { okundu_mu: true, okundu_tarihi: new Date() } },
        );
    }
}
