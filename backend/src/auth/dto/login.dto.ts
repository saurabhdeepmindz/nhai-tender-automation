import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsIn(['vendor', 'admin'])
  role: 'vendor' | 'admin';
}
