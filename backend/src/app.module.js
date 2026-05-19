import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './core/config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { UsersModule } from './features/users/users.module';
import { AuthModule } from './features/auth/auth.module';
import { ChannelsModule } from './features/channels/channels.module';
import { MessagesModule } from './features/messages/messages.module';
import { VoiceModule } from './features/voice/voice.module';
import { AdminModule } from './features/admin/admin.module';
import { FriendsModule } from './features/friends/friends.module';
import { DmModule } from './features/dm/dm.module';

@Module({
  imports: [ConfigModule, DatabaseModule, UsersModule, AuthModule, ChannelsModule, MessagesModule, VoiceModule, AdminModule, FriendsModule, DmModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
