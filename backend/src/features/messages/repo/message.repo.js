import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { BaseRepo } from '../../../base/BaseRepo';
import { MESSAGE_MODEL_NAME } from '../model/message.model';

@Injectable()
@Dependencies(getModelToken(MESSAGE_MODEL_NAME))
export class MessageRepo extends BaseRepo {
    constructor(messageModel) {
        super(messageModel);
    }

    async getByChannel(channelId, page = 1, limit = 30) {
        const skip = (page - 1) * limit;

        const data = await this.model
            .find({ kanal: channelId, silindi_mi: false })
            .sort({ olusturulma_tarihi: -1 })
            .skip(skip)
            .limit(limit)
            .populate('gonderen', 'username email role')
            .populate({
                path: 'alinti_yapilan_mesaj',
                populate: { path: 'gonderen', select: 'username' }
            });

        const total = await this.model.countDocuments({ kanal: channelId, silindi_mi: false });

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
