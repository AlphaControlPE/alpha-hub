import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto';
import { LoginDto } from './dto/login.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';
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

  @Get('recursos')
  @ApiOperation({ summary: 'Recursos opcionais habilitados nesta instalação' })
  recursos() {
    return this.auth.recursos();
  }

  // Mais rígido que o login: redefinição é alvo clássico de abuso.
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('esqueci')
  @ApiOperation({ summary: 'Solicita redefinição de senha por e-mail (resposta genérica)' })
  esqueci(@Body() dto: EsqueciSenhaDto, @Req() req: Request) {
    return this.auth.solicitarRedefinicao(dto, origem(req));
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('redefinir')
  @ApiOperation({ summary: 'Conclui a redefinição de senha com o token do e-mail' })
  redefinir(@Body() dto: RedefinirSenhaDto, @Req() req: Request) {
    return this.auth.redefinirSenha(dto, origem(req));
  }
}
