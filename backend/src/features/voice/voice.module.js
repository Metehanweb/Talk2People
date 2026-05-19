import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VOICE_SESSION_MODEL_NAME, VoiceSessionSchema } from './model/voice-session.model';
import { VoiceSessionRepo } from './repo/voice-session.repo';
import { VoiceService } from './service/voice.service';
import { VoiceController } from './controller/voice.controller';
import { VoiceGateway } from './gateway/voice.gateway';
import { AuthModule } from '../auth/auth.module';
import { ChannelsModule } from '../channels/channels.module';
import { DmModule } from '../dm/dm.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: VOICE_SESSION_MODEL_NAME, schema: VoiceSessionSchema },
        ]),
        ChannelsModule,
        DmModule,
        forwardRef(() => AuthModule),
    ],
    providers: [VoiceSessionRepo, VoiceService, VoiceGateway],
    controllers: [VoiceController],
    exports: [VoiceSessionRepo, VoiceService],
})
export class VoiceModule { }
