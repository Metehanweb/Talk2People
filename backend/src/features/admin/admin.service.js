import { BadRequestException, Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { USER_MODEL_NAME } from '../users/model/user.model';
import { CHANNEL_MODEL_NAME } from '../channels/model/channel.model';
import { MESSAGE_MODEL_NAME } from '../messages/model/message.model';
import { VOICE_SESSION_MODEL_NAME } from '../voice/model/voice-session.model';
import { REPORT_MODEL_NAME } from './model/report.model';
import { ADMIN_LOG_MODEL_NAME } from './model/admin-log.model';
import { successResponse } from '../../shared/response/response.helper';

@Injectable()
@Dependencies(
    getModelToken(USER_MODEL_NAME),
    getModelToken(CHANNEL_MODEL_NAME),
    getModelToken(MESSAGE_MODEL_NAME),
    getModelToken(VOICE_SESSION_MODEL_NAME),
    getModelToken(REPORT_MODEL_NAME),
    getModelToken(ADMIN_LOG_MODEL_NAME)
)
export class AdminService {
    constructor(userModel, channelModel, messageModel, voiceSessionModel, reportModel, adminLogModel) {
        this.userModel = userModel;
        this.channelModel = channelModel;
        this.messageModel = messageModel;
        this.voiceSessionModel = voiceSessionModel;
        this.reportModel = reportModel;
        this.adminLogModel = adminLogModel;
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

    async createReport(user, body = {}) {
        if (!['user', 'dm_message', 'channel_message'].includes(body.hedef_tipi) || !body.hedef_id || !String(body.neden || '').trim()) {
            throw new BadRequestException('Rapor tipi, hedef ve neden zorunludur');
        }

        const report = await this.reportModel.create({
            ad: `report-${body.hedef_tipi || 'unknown'}-${Date.now()}`,
            raporlayan: user.userId,
            hedef_kullanici: body.hedef_kullanici || null,
            hedef_tipi: body.hedef_tipi,
            hedef_id: body.hedef_id,
            neden: String(body.neden || '').trim().slice(0, 500),
        });

        await this.writeLog(user, 'report_created', 'report', report._id, {
            hedef_tipi: body.hedef_tipi,
            hedef_id: body.hedef_id,
        });

        return successResponse(report);
    }

    async getReports(query = {}) {
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
        const filters = { silindi_mi: false };
        if (query.durum) filters.durum = query.durum;

        const [data, total] = await Promise.all([
            this.reportModel
                .find(filters)
                .populate('raporlayan', 'username email role')
                .populate('hedef_kullanici', 'username email role')
                .sort({ olusturulma_tarihi: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            this.reportModel.countDocuments(filters),
        ]);

        return successResponse({
            reports: data,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    }

    async updateReportStatus(user, reportId, body = {}) {
        const updates = {};
        if (['open', 'reviewing', 'resolved', 'dismissed'].includes(body.durum)) {
            updates.durum = body.durum;
        }
        if (typeof body.notlar === 'string') {
            updates.notlar = body.notlar.slice(0, 1000);
        }

        const report = await this.reportModel.findByIdAndUpdate(reportId, { $set: updates }, { new: true });
        await this.writeLog(user, 'report_status_updated', 'report', reportId, updates);
        return successResponse(report);
    }

    async getLogs(query = {}) {
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(query.limit) || 30, 1), 100);
        const [data, total] = await Promise.all([
            this.adminLogModel
                .find({ silindi_mi: false })
                .populate('aktor', 'username email role')
                .sort({ olusturulma_tarihi: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            this.adminLogModel.countDocuments({ silindi_mi: false }),
        ]);

        return successResponse({
            logs: data,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    }

    async writeLog(user, action, targetType, targetId, detail = {}) {
        await this.adminLogModel.create({
            ad: action,
            aktor: user?.userId || user?._id || null,
            aksiyon: action,
            hedef_tipi: targetType,
            hedef_id: targetId,
            detay: detail,
        });
    }
}
