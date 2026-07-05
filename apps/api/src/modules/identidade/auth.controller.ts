import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsuarioAutenticado } from './jwt.strategy';

function origem(req: Request): string {
  const ip = req.ip ?? '';
  const ua = (req.headers['user-agent'] as string) ?? '';
  return `${ip} ${ua}`.trim();
}

@ApiTags('Identidade')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Limite rígido anti-força-bruta: 10 tentativas/minuto por IP.
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Cadastro de pessoa (núcleo gratuito)' })
  registrar(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.auth.registrar(dto, origem(req));
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @ApiOperation({ summary: 'Login e emissão de token' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, origem(req));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Usuário autenticado atual' })
  eu(@CurrentUser() user: UsuarioAutenticado) {
    return user;
  }
}
