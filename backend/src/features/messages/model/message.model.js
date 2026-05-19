import { Schema } from 'mongoose';
import { baseSchemaOptions } from '../../../base/BaseModel';

const MessageSchema = new Schema(
    {
        icerik: {
            type: String,
            required: true,
            trim: true,
        },
        kanal: {
            type: Schema.Types.ObjectId,
            ref: 'Channel',
            required: true,
            index: true,
        },
        gonderen: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        alinti_yapilan_mesaj: {
            type: Schema.Types.ObjectId,
            ref: 'Message',
            default: null,
        },
        tepkiler: [
            {
                emoji: { type: String, required: true },
                kullanicilar: [{ type: Schema.Types.ObjectId, ref: 'User' }],
            }
        ],
        silindi_mi: {
            type: Boolean,
            default: false,
        },
        duzenlendi_mi: {
            type: Boolean,
            default: false,
        },
        duzenlenme_tarihi: {
            type: Date,
            default: null,
        },
    },
    {
        ...baseSchemaOptions,
    },
);

export const MESSAGE_MODEL_NAME = 'Message';
export { MessageSchema };
