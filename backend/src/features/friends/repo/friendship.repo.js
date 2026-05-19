import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { BaseRepo } from '../../../base/BaseRepo';
import { FRIENDSHIP_MODEL_NAME } from '../model/friendship.model';

@Injectable()
@Dependencies(getModelToken(FRIENDSHIP_MODEL_NAME))
export class FriendshipRepo extends BaseRepo {
    constructor(friendshipModel) {
        super(friendshipModel);
    }

    async findBetween(userA, userB) {
        return this.model.findOne({
            silindi_mi: false,
            $or: [
                { isteyen: userA, hedef: userB },
                { isteyen: userB, hedef: userA },
            ],
        });
    }

    async findAnyBetween(userA, userB) {
        return this.model.findOne({
            $or: [
                { isteyen: userA, hedef: userB },
                { isteyen: userB, hedef: userA },
            ],
        });
    }

    async getFriends(userId) {
        return this.model
            .find({
                silindi_mi: false,
                durum: 'accepted',
                $or: [{ isteyen: userId }, { hedef: userId }],
            })
            .populate('isteyen', 'username email role aktif_mi')
            .populate('hedef', 'username email role aktif_mi')
            .sort({ degistirilme_tarihi: -1 });
    }

    async countFriends(userId) {
        return this.model.countDocuments({
            silindi_mi: false,
            durum: 'accepted',
            $or: [{ isteyen: userId }, { hedef: userId }],
        });
    }

    async getIncomingRequests(userId) {
        return this.model
            .find({ hedef: userId, durum: 'pending', silindi_mi: false })
            .populate('isteyen', 'username email role aktif_mi')
            .sort({ olusturulma_tarihi: -1 });
    }

    async getOutgoingRequests(userId) {
        return this.model
            .find({ isteyen: userId, durum: 'pending', silindi_mi: false })
            .populate('hedef', 'username email role aktif_mi')
            .sort({ olusturulma_tarihi: -1 });
    }
}
