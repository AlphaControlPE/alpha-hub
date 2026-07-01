import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'maria@exemplo.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senha-forte-123' })
  @IsString()
  senha!: string;
}
