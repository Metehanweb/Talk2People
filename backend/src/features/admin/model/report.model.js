import { Schema } from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from '../../../base/BaseModel';

const ReportSchema = new Schema(
    {
        ...baseSchemaFields,
        raporlayan: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        hedef_kullanici: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true,
        },
        hedef_tipi: {
            type: String,
            enum: ['user', 'dm_message', 'channel_message'],
            required: true,
        },
        hedef_id: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        neden: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        durum: {
            type: String,
            enum: ['open', 'reviewing', 'resolved', 'dismissed'],
            default: 'open',
            index: true,
        },
        notlar: {
            type: String,
            default: '',
            trim: true,
            maxlength: 1000,
        },
    },
    {
        ...baseSchemaOptions,
    },
);

export const REPORT_MODEL_NAME = 'Report';
export { ReportSchema };
