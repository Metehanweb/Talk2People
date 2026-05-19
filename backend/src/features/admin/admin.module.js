import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { USER_MODEL_NAME, UserSchema } from '../users/model/user.model';
import { CHANNEL_MODEL_NAME, ChannelSchema } from '../channels/model/channel.model';
import { MESSAGE_MODEL_NAME, MessageSchema } from '../messages/model/message.model';
import { VOICE_SESSION_MODEL_NAME, VoiceSessionSchema } from '../voice/model/voice-session.model';
import { REPORT_MODEL_NAME, ReportSchema } from './model/report.model';
import { ADMIN_LOG_MODEL_NAME, AdminLogSchema } from './model/admin-log.model';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../../shared/guards/roles.guard';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: USER_MODEL_NAME, schema: UserSchema },
            { name: CHANNEL_MODEL_NAME, schema: ChannelSchema },
            { name: MESSAGE_MODEL_NAME, schema: MessageSchema },
            { name: VOICE_SESSION_MODEL_NAME, schema: VoiceSessionSchema },
            { name: REPORT_MODEL_NAME, schema: ReportSchema },
            { name: ADMIN_LOG_MODEL_NAME, schema: AdminLogSchema },
        ]),
        forwardRef(() => AuthModule),
    ],
    providers: [AdminService, RolesGuard],
    controllers: [AdminController],
})
export class AdminModule { }
