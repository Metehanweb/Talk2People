import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';


@Module({
    imports: [
        MongooseModule.forRootAsync({
            useFactory: (configService) => {
                const uri = configService.get('MONGODB_URI');
                console.log('[DatabaseModule] MongoDB URI:', uri);
                return {
                    uri,
                    connectionFactory: (connection) => {
                        connection.on('connected', () => {
                            console.log('[DatabaseModule] MongoDB connected');
                        });
                        connection.on('error', (err) => {
                            console.error('[DatabaseModule] MongoDB error:', err.message);
                        });
                        connection.on('disconnected', () => {
                            console.warn('[DatabaseModule] MongoDB disconnected');
                        });
                        return connection;
                    },
                };
            },
            inject: [ConfigService],
        }),
    ],
})
export class DatabaseModule { }
