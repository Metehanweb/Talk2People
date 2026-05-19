import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DIRECT_MESSAGE_MODEL_NAME, DirectMessageSchema } from './model/direct-message.model';
import { DirectMessageRepo } from './repo/direct-message.repo';
import { DmService } from './service/dm.service';
import { DmController } from './controller/dm.controller';
import { FriendsModule } from '../friends/friends.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: DIRECT_MESSAGE_MODEL_NAME, schema: DirectMessageSchema },
        ]),
        FriendsModule,
        UsersModule,
        forwardRef(() => AuthModule),
    ],
    providers: [DirectMessageRepo, DmService],
    controllers: [DmController],
    exports: [DirectMessageRepo, DmService],
})
export class DmModule { }
