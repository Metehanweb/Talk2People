import { Schema } from 'mongoose';
import { baseSchemaFields, baseSchemaOptions } from '../../../base/BaseModel';

const FriendshipSchema = new Schema(
    {
        ...baseSchemaFields,
        isteyen: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        hedef: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        durum: {
            type: String,
            enum: ['pending', 'accepted'],
            default: 'pending',
        },
    },
    {
        ...baseSchemaOptions,
    },
);

FriendshipSchema.index({ isteyen: 1, hedef: 1 });

export const FRIENDSHIP_MODEL_NAME = 'Friendship';
export { FriendshipSchema };
