import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as Handlebars from 'handlebars';

export type SendResult = { ok: true; info: any } | { ok: false; error: string; retried?: number; simulated?: boolean };

export type MailPayload = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  attachments?: any[];
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: any | null = null;
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map();

  private smtpEnv() {
    const host = (process.env.SMTP_HOST || process.env.MAIL_HOST || '').trim() || null;
    const port = (process.env.SMTP_PORT || process.env.MAIL_PORT || '').trim() || null;
    const user = (process.env.SMTP_USER || process.env.MAIL_USER || '').trim() || null;
    const pass = (process.env.SMTP_PASS || process.env.MAIL_PASS || '').trim() || null;
    const secure = (process.env.SMTP_SECURE || 'false') === 'true';
    return { host, port: port ? Number(port) : null, user, pass, secure } as const;
  }

  private async loadTemplate(name: string) {
    if (this.templates.has(name)) return this.templates.get(name)!;
    const tplPath = path.join(__dirname, 'templates', `${name}.hbs`);
    try {
      const raw = await fs.readFile(tplPath, 'utf8');
      const compiled = Handlebars.compile(raw);
      this.templates.set(name, compiled);
      return compiled;
    } catch (e) {
      this.logger.error(`Email template load failed (${name}): ${(e as any)?.message}`);
      throw e;
    }
  }

  private async initTransport() {
    if (this.transporter) return this.transporter;

    const env = this.smtpEnv();
    let nodemailer: any = null;
    try {
      nodemailer = (await import('nodemailer'))?.default ?? (await import('nodemailer'));
    } catch (e) {
      this.logger.warn('nodemailer not available at runtime; emails will be logged instead');
      nodemailer = null;
    }

    if (!nodemailer) {
      this.transporter = null;
      return null;
    }

    if (env.host && env.port) {
      const opts: any = { host: env.host, port: env.port, secure: env.secure };
      if (env.user && env.pass) opts.auth = { user: env.user, pass: env.pass };
      this.transporter = nodemailer.createTransport(opts);
      try {
        await this.transporter.verify();
        this.logger.log('SMTP transporter verified');
      } catch (e) {
        this.logger.warn('SMTP transporter verification failed: ' + (e as any)?.message);
      }
      return this.transporter;
    }

    // fallback to sendmail
    try {
      this.transporter = nodemailer.createTransport({ sendmail: true, newline: 'unix', path: '/usr/sbin/sendmail' });
      this.logger.log('Using sendmail fallback transporter');
      return this.transporter;
    } catch (e) {
      this.logger.warn('Failed to create sendmail transporter: ' + (e as any)?.message);
      this.transporter = null;
      return null;
    }
  }

  async sendMail(payload: MailPayload, maxRetries = 2): Promise<SendResult> {
    const transport = await this.initTransport();
    const fromEnv = (process.env.EMAIL_FROM || process.env.SMTP_FROM || 'no-reply@localhost').trim();
    const fromName = (process.env.EMAIL_FROM_NAME || 'No Reply').trim();
    const from = payload.from ?? `${fromName} <${fromEnv}>`;

    if (!transport) {
      this.logger.log('SMTP not configured or nodemailer missing — logging email instead of sending');
      this.logger.debug({ from, to: payload.to, subject: payload.subject, text: payload.text, htmlPreview: (payload.html || '').slice(0, 400) });
      return { ok: false, error: 'smtp-unavailable', simulated: true };
    }

    let attempt = 0;
    let lastErr: any = null;
    while (attempt <= maxRetries) {
      try {
        const info = await transport.sendMail({ from, to: payload.to, subject: payload.subject, text: payload.text, html: payload.html, attachments: payload.attachments });
        this.logger.log(`Email sent to ${Array.isArray(payload.to) ? payload.to.join(',') : payload.to} messageId=${info?.messageId}`);
        return { ok: true, info };
      } catch (e) {
        lastErr = e;
        attempt += 1;
        this.logger.warn(`Email send attempt ${attempt} failed: ${(e as any)?.message}`);
        await new Promise((r) => setTimeout(r, 200 * attempt));
      }
    }

    return { ok: false, error: (lastErr && lastErr.message) || 'send-failed', retried: maxRetries };
  }

  async sendTemplate(to: string | string[], subject: string, templateName: string, context: any = {}, attachments?: any[]): Promise<SendResult> {
    try {
      const tpl = await this.loadTemplate(templateName);
      const html = tpl(context);
      const text = (context && (context.plain as string)) || html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').slice(0, 2000);
      return await this.sendMail({ to, subject, html, text, attachments });
    } catch (e) {
      this.logger.error(`sendTemplate(${templateName}) failed: ${(e as any)?.message}`);
      return { ok: false, error: (e as any)?.message || 'template-render-failed' };
    }
  }

  async sendOrderReceipt(to: string | string[], order: any): Promise<SendResult> {
    const subject = `Receipt ${order?.code ?? order?.id}`;
    const context = {
      order: { id: order?.id, code: order?.code, createdAt: order?.createdAt, total: order?.total },
      items: (order?.items || []).map((it: any) => ({ name: it.product?.name ?? 'Item', qty: it.quantity, unit: it.product?.price ?? 0, total: ((it.product?.price ?? 0) * (it.quantity || 1)).toFixed(2) })),
      plain: `Order ${order?.code || order?.id} total ${order?.total}`,
    };
    return this.sendTemplate(to, subject, 'receipt_email', context);
  }
}
