import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'maria@exemplo.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email!: string;

  @ApiProperty({ example: 'senha-forte-123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter ao menos 8 caracteres' })
  senha!: string;

  @ApiProperty({ example: 'Maria Souza' })
  @IsString()
  @MinLength(2)
  nome!: string;

  @ApiProperty({ required: false, example: 'Designer de produto' })
  @IsOptional()
  @IsString()
  bio?: string;
}
