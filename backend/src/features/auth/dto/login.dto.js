import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * { "email": "test@test.com", "password": "123456" }
 */
export class LoginDto {
    @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
    @IsNotEmpty({ message: 'Email zorunludur' })
    email;

    @IsString({ message: 'Şifre metin olmalıdır' })
    @IsNotEmpty({ message: 'Şifre zorunludur' })
    password;
}
