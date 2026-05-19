import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FRIENDSHIP_MODEL_NAME, FriendshipSchema } from './model/friendship.model';
import { FriendshipRepo } from './repo/friendship.repo';
import { FriendsService } from './service/friends.service';
import { FriendsController } from './controller/friends.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: FRIENDSHIP_MODEL_NAME, schema: FriendshipSchema },
        ]),
        UsersModule,
        forwardRef(() => AuthModule),
    ],
    providers: [FriendshipRepo, FriendsService],
    controllers: [FriendsController],
    exports: [FriendshipRepo, FriendsService],
})
export class FriendsModule { }
