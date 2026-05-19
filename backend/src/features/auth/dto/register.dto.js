import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
    @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
    @IsNotEmpty({ message: 'Email zorunludur' })
    email;

    @IsString({ message: 'Şifre metin olmalıdır' })
    @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
    @MaxLength(50, { message: 'Şifre en fazla 50 karakter olabilir' })
    @IsNotEmpty({ message: 'Şifre zorunludur' })
    password;

    @IsString({ message: 'Kullanıcı adı metin olmalıdır' })
    @MinLength(3, { message: 'Kullanıcı adı en az 3 karakter olmalıdır' })
    @MaxLength(30, { message: 'Kullanıcı adı en fazla 30 karakter olabilir' })
    @IsNotEmpty({ message: 'Kullanıcı adı zorunludur' })
    username;
}
