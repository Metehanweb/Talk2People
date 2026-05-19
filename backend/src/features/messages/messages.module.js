import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MESSAGE_MODEL_NAME, MessageSchema } from './model/message.model';
import { MessageRepo } from './repo/message.repo';
import { MessagesService } from './service/messages.service';
import { MessagesController } from './controller/messages.controller';
import { ChatGateway } from './gateway/chat.gateway';
import { AuthModule } from '../auth/auth.module';
import { ChannelsModule } from '../channels/channels.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: MESSAGE_MODEL_NAME, schema: MessageSchema },
        ]),
        ChannelsModule,
        forwardRef(() => AuthModule),
    ],
    providers: [MessageRepo, MessagesService, ChatGateway],
    controllers: [MessagesController],
    exports: [MessageRepo],
})
export class MessagesModule { }
