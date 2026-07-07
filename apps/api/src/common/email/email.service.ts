import { Injectable, Logger } from '@nestjs/common';

export interface EmailMensagem {
  para: string;
  assunto: string;
  html: string;
}

/**
 * Envio de e-mail transacional via Resend (https://resend.com), usando fetch
 * nativo — sem SDK. O recurso é OPCIONAL: sem RESEND_API_KEY, `disponivel`
 * é false e as features que dependem de e-mail ficam desligadas (nada de
 * fachada). Em NODE_ENV=test nada sai para a rede: o último e-mail fica
 * inspecionável em EmailService.ultimoEmailTeste.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  /** Último e-mail "enviado" em modo teste (para os e2e lerem o link/token). */
  static ultimoEmailTeste: EmailMensagem | null = null;

  get disponivel(): boolean {
    return Boolean(process.env.RESEND_API_KEY);
  }

  async enviar(msg: EmailMensagem): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      EmailService.ultimoEmailTeste = msg;
      return;
    }
    if (!this.disponivel) {
      throw new Error('E-mail não configurado (RESEND_API_KEY ausente)');
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Sem domínio verificado no Resend, use o remetente de onboarding.
        from: process.env.RESEND_FROM ?? 'Alpha Hub <onboarding@resend.dev>',
        to: [msg.para],
        subject: msg.assunto,
        html: msg.html,
      }),
    });
    if (!res.ok) {
      const corpo = await res.text().catch(() => '');
      this.logger.error(`Falha ao enviar e-mail (${res.status}): ${corpo.slice(0, 300)}`);
      throw new Error('Falha ao enviar e-mail');
    }
  }
}
