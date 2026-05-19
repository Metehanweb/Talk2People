import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CHANNEL_MODEL_NAME, ChannelSchema } from './model/channel.model';
import { ChannelRepo } from './repo/channel.repo';
import { ChannelsService } from './service/channels.service';
import { ChannelsController } from './controller/channels.controller';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../../shared/guards/roles.guard';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: CHANNEL_MODEL_NAME, schema: ChannelSchema },
        ]),
        forwardRef(() => AuthModule),
    ],
    providers: [ChannelRepo, ChannelsService, RolesGuard],
    controllers: [ChannelsController],
    exports: [ChannelRepo, ChannelsService],
})
export class ChannelsModule { }
