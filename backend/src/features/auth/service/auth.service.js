import { Injectable, Dependencies } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepo } from '../../users/repo/user.repo';


@Injectable()
@Dependencies(ConfigService, UserRepo)
export class AuthService {
    constructor(configService, userRepo) {
        this.configService = configService;
        this.userRepo = userRepo;
        this.jwtSecret = configService.get('JWT_SECRET');
        this.jwtExpiresIn = configService.get('JWT_EXPIRES_IN');
    }


    async hashPassword(plainPassword) {
        const saltRounds = 10;
        return bcrypt.hash(plainPassword, saltRounds);
    }


    async comparePassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }


    generateToken(user) {
        const payload = {
            sub: user._id,
            email: user.email,
            role: user.role,
        };

        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpiresIn,
        });
    }


    verifyToken(token) {
        return jwt.verify(token, this.jwtSecret);
    }


    async getUserFromToken(token) {
        const decoded = this.verifyToken(token);
        const user = await this.userRepo.findById(decoded.sub);

        return { decoded, user };
    }
}
