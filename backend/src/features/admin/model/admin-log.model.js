import { Schema } from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from '../../../base/BaseModel';

const AdminLogSchema = new Schema(
    {
        ...baseSchemaFields,
        aktor: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true,
        },
        aksiyon: {
            type: String,
            required: true,
            trim: true,
        },
        hedef_tipi: {
            type: String,
            default: '',
            trim: true,
        },
        hedef_id: {
            type: Schema.Types.ObjectId,
            default: null,
        },
        detay: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        ...baseSchemaOptions,
    },
);

export const ADMIN_LOG_MODEL_NAME = 'AdminLog';
export { AdminLogSchema };
