import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { BaseRepo } from '../../../base/BaseRepo';
import { USER_MODEL_NAME } from '../model/user.model';

@Injectable()
@Dependencies(getModelToken(USER_MODEL_NAME))
export class UserRepo extends BaseRepo {
    constructor(userModel) {
        super(userModel);
    }

    async findByEmail(email) {
        return this.model.findOne({ email, silindi_mi: false }).select('+password');
    }

    async findById(id) {
        return this.model.findOne({ _id: id, silindi_mi: false });
    }

    async existsByEmail(email) {
        const count = await this.model.countDocuments({ email, silindi_mi: false });
        return count > 0;
    }
}
