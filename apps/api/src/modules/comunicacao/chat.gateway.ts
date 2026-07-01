import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../identidade/jwt.strategy';
import { ConversasService } from './conversas.service';

const sala = (conversaId: string) => `conversa:${conversaId}`;

/**
 * Chat em tempo real (escopo 08). Autentica o socket pelo mesmo JWT da API,
 * isola por sala de conversa e só entrega a quem participa.
 */
@WebSocketGateway({ cors: { origin: process.env.WEB_ORIGIN ?? '*' } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly conversas: ConversasService,
  ) {}

  handleConnection(client: Socket): void {
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.query?.token as string);
    try {
      const payload = this.jwt.verify<JwtPayload>(token);
      client.data.userId = payload.sub;
    } catch {
      client.emit('erro', { mensagem: 'Token inválido' });
      client.disconnect(true);
    }
  }

  @SubscribeMessage('conversa:entrar')
  async entrar(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversaId: string,
  ): Promise<{ ok: boolean }> {
    const userId = client.data.userId as string;
    if (!userId || !(await this.conversas.ehParticipante(conversaId, userId))) {
      return { ok: false };
    }
    await client.join(sala(conversaId));
    return { ok: true };
  }

  @SubscribeMessage('mensagem:enviar')
  async enviar(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversaId: string; conteudo: string },
  ): Promise<{ ok: boolean }> {
    const userId = client.data.userId as string;
    if (!userId) return { ok: false };
    try {
      const mensagem = await this.conversas.enviarMensagem(
        body.conversaId,
        userId,
        body.conteudo,
      );
      this.emitirNovaMensagem(body.conversaId, mensagem);
      return { ok: true };
    } catch (err) {
      this.logger.warn(`Falha ao enviar mensagem: ${(err as Error).message}`);
      return { ok: false };
    }
  }

  /** Emite para todos na sala — usado pelo gateway e pelo controller REST. */
  emitirNovaMensagem(conversaId: string, mensagem: unknown): void {
    this.server.to(sala(conversaId)).emit('mensagem:nova', mensagem);
  }
}
