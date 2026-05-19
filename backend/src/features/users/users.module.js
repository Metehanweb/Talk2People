import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { USER_MODEL_NAME, UserSchema } from './model/user.model';
import { UserRepo } from './repo/user.repo';
import { UsersService } from './service/users.service';
import { UsersController } from './controller/users.controller';
import { AuthModule } from '../auth/auth.module';
import { FRIENDSHIP_MODEL_NAME, FriendshipSchema } from '../friends/model/friendship.model';
import { FriendshipRepo } from '../friends/repo/friendship.repo';
import { RolesGuard } from '../../shared/guards/roles.guard';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: USER_MODEL_NAME, schema: UserSchema },
            { name: FRIENDSHIP_MODEL_NAME, schema: FriendshipSchema },
        ]),
        forwardRef(() => AuthModule),
    ],
    providers: [UserRepo, FriendshipRepo, UsersService, RolesGuard],
    controllers: [UsersController],
    exports: [UserRepo],
})
export class UsersModule { }
