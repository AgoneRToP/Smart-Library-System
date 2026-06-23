import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || '://gmail.com',
      port: Number(process.env.MAIL_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendActivationEmail(
    to: string,
    fullName: string,
    token: string,
  ): Promise<void> {
    const mailOptions = {
      from: `"Smart Clinic" <${process.env.MAIL_USER}>`,
      to: to,
      subject: '🔑 Код активации аккаунта Smart Library',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center;">
          <h2 style="color: #0ea5e9; margin-bottom: 10px;">Подтверждение регистрации</h2>
          <p style="font-size: 16px; color: #0f172a;">Здравствуйте, <b>${fullName}</b>!</p>
          <p style="font-size: 14px; color: #64748b; line-height: 1.5;">Ваш одноразовый цифровой PIN-код для подтверждения профиля клиники:</p>
          <div style="background-color: #f8fafc; border: 2px dashed #0ea5e9; padding: 15px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a; margin: 20px auto; max-width: 210px; border-radius: 8px;">
            ${token}
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 15px;">Код действителен в течение 15 минут. Никому не сообщайте данный PIN-код.</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
