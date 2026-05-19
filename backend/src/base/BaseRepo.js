/**
 * Kullanım:
 * export class UserRepo extends BaseRepo { constructor(userModel) { super(userModel); } }
 *
 * metodlar:
 *   get_one(id)
 *   get_many(filters, sortBy, sortOrder, page, limit)
 *   create(data)
 *   patch(id, data)
 *   soft_delete(id
 *   hard_delete(id)
 */
export class BaseRepo {
    constructor(model) {
        this.model = model;
    }

    async get_one(id) {
        return this.model.findOne({ _id: id, silindi_mi: false });
    }

    async get_many(filters = {}, sortBy = 'olusturulma_tarihi', sortOrder = -1, page = 1, limit = 10) {
        const queryFilters = { ...filters, silindi_mi: false };
        const skip = (page - 1) * limit;

        const data = await this.model
            .find(queryFilters)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit);

        const total = await this.model.countDocuments(queryFilters);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async create(data) {
        return this.model.create(data);
    }

    async patch(id, data) {
        return this.model.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true },
        );
    }

    async soft_delete(id, cascadeModels = []) {
        const result = await this.model.findByIdAndUpdate(
            id,
            { silindi_mi: true, aktif_mi: false },
            { new: true },
        );

        if (cascadeModels.length > 0) {
            for (const { model: childModel, foreignKey } of cascadeModels) {
                await childModel.updateMany(
                    { [foreignKey]: id },
                    { $set: { silindi_mi: true, aktif_mi: false } },
                );
            }
        }

        return result;
    }

    async hard_delete(id) {
        return this.model.findByIdAndDelete(id);
    }
}
