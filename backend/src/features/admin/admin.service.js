import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { USER_MODEL_NAME } from '../users/model/user.model';
import { CHANNEL_MODEL_NAME } from '../channels/model/channel.model';
import { MESSAGE_MODEL_NAME } from '../messages/model/message.model';
import { VOICE_SESSION_MODEL_NAME } from '../voice/model/voice-session.model';
import { successResponse } from '../../shared/response/response.helper';

@Injectable()
@Dependencies(
    getModelToken(USER_MODEL_NAME),
    getModelToken(CHANNEL_MODEL_NAME),
    getModelToken(MESSAGE_MODEL_NAME),
    getModelToken(VOICE_SESSION_MODEL_NAME)
)
export class AdminService {
    constructor(userModel, channelModel, messageModel, voiceSessionModel) {
        this.userModel = userModel;
        this.channelModel = channelModel;
        this.messageModel = messageModel;
        this.voiceSessionModel = voiceSessionModel;
    }

    async getStats() {
        const [totalUsers, totalChannels, totalMessages, activeVoiceSessions] = await Promise.all([
            this.userModel.countDocuments({ silindi_mi: false }),
            this.channelModel.countDocuments({ silindi_mi: false }),
            this.messageModel.countDocuments({ silindi_mi: false }),
            this.voiceSessionModel.countDocuments({ aktif_mi: true }),
        ]);

        return successResponse({
            totalUsers,
            totalChannels,
            totalMessages,
            activeVoiceSessions,
        });
    }
}
