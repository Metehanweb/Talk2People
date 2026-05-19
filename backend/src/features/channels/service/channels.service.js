import { Injectable, Dependencies, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChannelRepo } from '../repo/channel.repo';
import { AuthService } from '../../auth/service/auth.service';
import { successResponse, listResponse } from '../../../shared/response/response.helper';

@Injectable()
@Dependencies(ChannelRepo, AuthService)
export class ChannelsService {
    constructor(channelRepo, authService) {
        this.channelRepo = channelRepo;
        this.authService = authService;
        this.roleRank = { user: 1, moderator: 2, admin: 3 };
    }

    async createChannel(data, userId) {
        const channelData = {
            ...(await this.prepareChannelData(data)),
            olusturan: userId,
        };
        const channel = await this.channelRepo.create(channelData);
        return successResponse(channel);
    }

    async getChannels(query = {}) {
        const {
            page = 1,
            limit = 20,
            sortBy = 'olusturulma_tarihi',
            sortOrder = -1,
            tur,
        } = query;

        const filters = {};
        if (tur) filters.tur = tur;

        const result = await this.channelRepo.get_many(filters, sortBy, Number(sortOrder), Number(page), Number(limit));

        return listResponse(result.data, {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        });
    }

    async getChannelById(id, user = null, options = {}) {
        const channel = await this.channelRepo.get_one(id);
        if (!channel) {
            throw new NotFoundException('Kanal bulunamadı');
        }
        if (user) {
            await this.validateChannelAccess(id, user, options);
        }
        return successResponse(channel);
    }

    async updateChannel(id, data) {
        const channel = await this.channelRepo.get_one(id);
        if (!channel) {
            throw new NotFoundException('Kanal bulunamadı');
        }
        const updated = await this.channelRepo.patch(id, await this.prepareChannelData(data));
        return successResponse(updated);
    }

    async deleteChannel(id) {
        const channel = await this.channelRepo.get_one(id);
        if (!channel) {
            throw new NotFoundException('Kanal bulunamadı');
        }
        await this.channelRepo.soft_delete(id);
        return successResponse({ message: 'Kanal başarıyla silindi' });
    }

    async prepareChannelData(data = {}) {
        const channelData = { ...data };

        if (channelData.kullanici_limiti !== undefined) {
            channelData.kullanici_limiti = Math.max(0, Number(channelData.kullanici_limiti) || 0);
        }

        if (channelData.gerekli_rol && !this.roleRank[channelData.gerekli_rol]) {
            delete channelData.gerekli_rol;
        }

        if (channelData.kanal_sifresi !== undefined) {
            const password = String(channelData.kanal_sifresi || '').trim();
            delete channelData.kanal_sifresi;

            if (password) {
                channelData.sifre_hash = await this.authService.hashPassword(password);
                channelData.sifreli_mi = true;
            } else {
                channelData.sifre_hash = null;
                channelData.sifreli_mi = false;
            }
        }

        return channelData;
    }

    async validateChannelAccess(channelId, user, options = {}) {
        const channel = await this.channelRepo.getOneWithPassword(channelId);
        if (!channel) {
            throw new NotFoundException('Kanal bulunamadı');
        }

        const userRole = user.role || 'user';
        const requiredRole = channel.gerekli_rol || 'user';
        if ((this.roleRank[userRole] || 0) < (this.roleRank[requiredRole] || 1)) {
            throw new ForbiddenException('Bu kanala katılmak için gerekli role sahip değilsiniz');
        }

        if (channel.sifreli_mi) {
            const password = String(options.kanal_sifresi || '').trim();
            let isPasswordValid = false;

            if (password && channel.sifre_hash) {
                try {
                    isPasswordValid = await this.authService.comparePassword(password, channel.sifre_hash);
                } catch {
                    isPasswordValid = false;
                }
            }

            if (!isPasswordValid) {
                throw new ForbiddenException('Kanal şifresi hatalı');
            }
        }

        return channel;
    }
}
