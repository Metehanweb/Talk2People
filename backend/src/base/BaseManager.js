
export class BaseManager {
    constructor(repo) {
        this.repo = repo;
    }

    async getOne(id) {
        const kayit = await this.repo.get_one(id);
        if (!kayit) {
            throw new Error('İstenen kayıt bulunamadı.');
        }
        return kayit;
    }

    async getMany(filters, sortBy, sortOrder, page, limit) {
        return this.repo.get_many(filters, sortBy, sortOrder, page, limit);
    }

    async create(data) {
        return this.repo.create(data);
    }

    async patch(id, data) {
        const kayit = await this.repo.get_one(id);
        if (!kayit) {
            throw new Error('Güncellenecek kayıt bulunamadı.');
        }
        return this.repo.patch(id, data);
    }

    async softDelete(id, cascadeModels = []) {
        const kayit = await this.repo.get_one(id);
        if (!kayit) {
            throw new Error('Silinecek kayıt bulunamadı.');
        }
        return this.repo.soft_delete(id, cascadeModels);
    }

    async hardDelete(id) {
        const kayit = await this.repo.get_one(id);
        if (!kayit) {
            throw new Error('Silinecek kayıt bulunamadı.');
        }
        return this.repo.hard_delete(id);
    }
}
