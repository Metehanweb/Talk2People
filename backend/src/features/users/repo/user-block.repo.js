import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { BaseRepo } from '../../../base/BaseRepo';
import { USER_BLOCK_MODEL_NAME } from '../model/user-block.model';

@Injectable()
@Dependencies(getModelToken(USER_BLOCK_MODEL_NAME))
export class UserBlockRepo extends BaseRepo {
    constructor(userBlockModel) {
        super(userBlockModel);
    }

    async findBetween(userA, userB) {
        return this.model.findOne({
            silindi_mi: false,
            $or: [
                { engelleyen: userA, engellenen: userB },
                { engelleyen: userB, engellenen: userA },
            ],
        });
    }

    async findOwnBlock(blockerId, blockedId) {
        return this.model.findOne({
            engelleyen: blockerId,
            engellenen: blockedId,
            silindi_mi: false,
        });
    }

    async getBlockedUsers(userId) {
        return this.model
            .find({ engelleyen: userId, silindi_mi: false })
            .populate('engellenen', 'username email role profil_fotografi_url durum_modu')
            .sort({ olusturulma_tarihi: -1 });
    }
}
