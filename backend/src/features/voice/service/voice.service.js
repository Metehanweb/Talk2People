import { Injectable, Dependencies, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { VoiceSessionRepo } from '../repo/voice-session.repo';
import { ChannelsService } from '../../channels/service/channels.service';
import { successResponse, listResponse } from '../../../shared/response/response.helper';

@Injectable()
@Dependencies(VoiceSessionRepo, ChannelsService)
export class VoiceService {
    constructor(voiceSessionRepo, channelsService) {
        this.voiceSessionRepo = voiceSessionRepo;
        this.channelsService = channelsService;
    }

    // Sunucu yeniden başladığında asılı kalan (zombi) oturumları temizle
    async onModuleInit() {
        try {
            await this.voiceSessionRepo.model.updateMany({}, { $set: { aktif_mi: false } });
            console.log('[VoiceService] Tüm önceki sesli oturumlar (zombiler) temizlendi.');
        } catch (err) {
            console.error('[VoiceService] Oturum temizliği sırasında hata:', err);
        }
    }

    // Kullanıcı kanala katılır
    async joinChannel(channelId, user, options = {}) {
        const channel = await this.channelsService.validateChannelAccess(channelId, user, options);
        const userId = user.userId;

        // Zaten aktif bir oturum var mı kontrol et
        const existing = await this.voiceSessionRepo.findActiveSession(channelId, userId);
        if (existing) {
            // Eğer zaten aktifse, bir hata fırlatmak yerine sadece başarılı dön
            // Çünkü sayfa yenilenmiş olabilir.
            return successResponse(existing);
        }

        const activeParticipants = await this.voiceSessionRepo.getActiveByChannel(channelId);
        if (channel.kullanici_limiti > 0 && activeParticipants.length >= channel.kullanici_limiti) {
            throw new ConflictException('Bu ses kanalının kullanıcı limiti dolu');
        }

        // Önceki inaktif oturumları kontrol edip aktif yapabilirdik ama yeni oluşturmak daha temiz log tutar
        const session = await this.voiceSessionRepo.create({
            kanal: channelId,
            kullanici: userId,
            aktif_mi: true,
            katilma_tarihi: new Date(),
            ad: `session-${userId}-${channelId}`, // BaseModel için zorunlu ad alanı
        });

        return successResponse(session);
    }

    // Kullanıcı kanaldan ayrılır
    async leaveChannel(channelId, userId) {
        const session = await this.voiceSessionRepo.findActiveSession(channelId, userId);
        if (!session) {
            throw new NotFoundException('Bu voice kanalında aktif oturumunuz yok');
        }

        await this.voiceSessionRepo.patch(session._id, {
            aktif_mi: false,
            ayrilma_tarihi: new Date(),
        });

        return successResponse({ message: 'Voice kanalından ayrıldınız' });
    }

    // Kullanıcı durumunu günceller (mute/deafen)
    async updateStatus(channelId, userId, { sessiz_mi, sagir_mi }) {
        const session = await this.voiceSessionRepo.findActiveSession(channelId, userId);
        if (!session) {
            throw new NotFoundException('Aktif bir voice oturumu bulunamadı');
        }

        const updates = {};
        if (sessiz_mi !== undefined) updates.sessiz_mi = sessiz_mi;
        if (sagir_mi !== undefined) updates.sagir_mi = sagir_mi;

        const updated = await this.voiceSessionRepo.patch(session._id, updates);
        return successResponse(updated);
    }

    // Kanaldaki aktif katılımcıları listele
    async getParticipants(channelId) {
        const participants = await this.voiceSessionRepo.getActiveByChannel(channelId);
        return listResponse(participants, { total: participants.length });
    }
}
