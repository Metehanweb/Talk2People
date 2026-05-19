import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { BaseRepo } from '../../../base/BaseRepo';
import { VOICE_SESSION_MODEL_NAME } from '../model/voice-session.model';

@Injectable()
@Dependencies(getModelToken(VOICE_SESSION_MODEL_NAME))
export class VoiceSessionRepo extends BaseRepo {
    constructor(voiceSessionModel) {
        super(voiceSessionModel);
    }

    // Bir kanaldaki tüm aktif katılımcıları getir
    async getActiveByChannel(channelId) {
        return this.model
            .find({ kanal: channelId, aktif_mi: true })
            .populate('kullanici', 'username email role')
            .sort({ katilma_tarihi: 1 });
    }

    // Bir kullanıcının belirli bir kanaldaki aktif oturumunu bul
    async findActiveSession(channelId, userId) {
        return this.model.findOne({ kanal: channelId, kullanici: userId, aktif_mi: true });
    }
}
