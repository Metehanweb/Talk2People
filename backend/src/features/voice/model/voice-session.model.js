import { Schema } from 'mongoose';
import { baseSchemaOptions } from '../../../base/BaseModel';

// VoiceSession: Bir voice kanalındaki aktif oturumu temsil eder.
// Kullanıcı "katıl" dediğinde session başlar, "ayrıl" dediğinde biter.
const VoiceSessionSchema = new Schema(
    {
        kanal: {
            type: Schema.Types.ObjectId,
            ref: 'Channel',
            required: true,
            index: true,
        },
        kullanici: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // Kullanıcı durumları
        sessiz_mi: {          // muted
            type: Boolean,
            default: false,
        },
        sagir_mi: {           // deafened
            type: Boolean,
            default: false,
        },
        // Oturum süresi takibi
        katilma_tarihi: {
            type: Date,
            default: Date.now,
        },
        ayrilma_tarihi: {
            type: Date,
            default: null,
        },
        aktif_mi: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        ...baseSchemaOptions,
    },
);

export const VOICE_SESSION_MODEL_NAME = 'VoiceSession';
export { VoiceSessionSchema };
