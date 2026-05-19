import { Schema } from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from '../../../base/BaseModel';

const ChannelSchema = new Schema(
    {
        ...baseSchemaFields,

        tur: {
            type: String,
            enum: ['text', 'voice'],
            default: 'text',
        },
        olusturan: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        kullanici_limiti: {
            type: Number,
            default: 0,
            min: 0,
        },
        gerekli_rol: {
            type: String,
            enum: ['user', 'moderator', 'admin'],
            default: 'user',
        },
        sifreli_mi: {
            type: Boolean,
            default: false,
        },
        sifre_hash: {
            type: String,
            select: false,
        },
    },
    {
        ...baseSchemaOptions,
        toJSON: {
            transform: (doc, ret) => {
                delete ret.sifre_hash;
                delete ret.__v;
                return ret;
            },
        },
    },
);

export const CHANNEL_MODEL_NAME = 'Channel';
export { ChannelSchema };
