import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../identidade/jwt.strategy';

const salaUsuario = (userId: string) => `user:${userId}`;

/**
 * Entrega de notificações em tempo real (Parte XIII). Cada socket autenticado
 * entra na sala pessoal do usuário; o serviço emite `notificacao:nova` para ela.
 */
@WebSocketGateway({ cors: { origin: process.env.WEB_ORIGIN ?? '*' } })
export class NotificacoesGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  constructor(private readonly jwt: JwtService) {}

  handleConnection(client: Socket): void {
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.query?.token as string);
    try {
      const payload = this.jwt.verify<JwtPayload>(token);
      void client.join(salaUsuario(payload.sub));
    } catch {
      /* sockets sem token continuam conectados (ex.: só chat); não derruba aqui */
    }
  }

  emitirPara(userId: string, notificacao: unknown): void {
    this.server?.to(salaUsuario(userId)).emit('notificacao:nova', notificacao);
  }
}
