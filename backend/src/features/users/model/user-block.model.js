import { Schema } from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from '../../../base/BaseModel';

const UserBlockSchema = new Schema(
    {
        ...baseSchemaFields,
        engelleyen: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        engellenen: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
    },
    {
        ...baseSchemaOptions,
    },
);

UserBlockSchema.index({ engelleyen: 1, engellenen: 1 }, { unique: true });

export const USER_BLOCK_MODEL_NAME = 'UserBlock';
export { UserBlockSchema };
