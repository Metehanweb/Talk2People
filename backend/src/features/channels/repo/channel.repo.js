import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { BaseRepo } from '../../../base/BaseRepo';
import { CHANNEL_MODEL_NAME } from '../model/channel.model';

@Injectable()
@Dependencies(getModelToken(CHANNEL_MODEL_NAME))
export class ChannelRepo extends BaseRepo {
    constructor(channelModel) {
        super(channelModel);
    }

    async findByCreator(userId) {
        return this.model.find({ olusturan: userId, silindi_mi: false });
    }

    async getOneWithPassword(id) {
        return this.model.findOne({ _id: id, silindi_mi: false }).select('+sifre_hash');
    }
}
