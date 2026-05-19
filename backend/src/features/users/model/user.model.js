import { Schema } from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from '../../../base/BaseModel';

const UserSchema = new Schema(
    {
        ...baseSchemaFields,

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'moderator'],
            default: 'user',
        },
        extra_roles: {
            type: [String],
            enum: ['vip', 'support', 'founder', 'tester'],
            default: [],
        },
        profil_fotografi_url: {
            type: String,
            default: '',
            trim: true,
        },
        durum_modu: {
            type: String,
            enum: ['online', 'idle', 'dnd', 'invisible'],
            default: 'online',
        },
        son_cevrimici_tarihi: {
            type: Date,
            default: null,
        },
    },
    {
        ...baseSchemaOptions,
        toJSON: {
            transform: (doc, ret) => {
                delete ret.password;
                delete ret.__v;
                return ret;
            },
        },
    },
);

export const USER_MODEL_NAME = 'User';
export { UserSchema };
