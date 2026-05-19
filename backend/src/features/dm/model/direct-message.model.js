import { Schema } from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from '../../../base/BaseModel';

const DirectMessageSchema = new Schema(
    {
        ...baseSchemaFields,
        icerik: {
            type: String,
            required: true,
            trim: true,
        },
        gonderen: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        alici: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        okundu_mu: {
            type: Boolean,
            default: false,
        },
    },
    {
        ...baseSchemaOptions,
    },
);

DirectMessageSchema.index({ gonderen: 1, alici: 1, olusturulma_tarihi: -1 });

export const DIRECT_MESSAGE_MODEL_NAME = 'DirectMessage';
export { DirectMessageSchema };
