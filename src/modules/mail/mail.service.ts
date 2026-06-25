import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
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
    isLogin: boolean = false,
  ): Promise<void> {
    const subjectText = isLogin
      ? '🔐 Код безопасности для входа в Smart Library'
      : '🔑 Код активации аккаунта Smart Library';

    const titleText = isLogin
      ? 'Подтверждение входа'
      : 'Подтверждение регистрации';

    const descriptionText = isLogin
      ? 'Ваш одноразовый цифровой PIN-код для безопасного входа в личный кабинет библиотеки:'
      : 'Ваш одноразовый цифровой PIN-код для подтверждения и активации вашего аккаунта библиотеки:';

    const mailOptions = {
      from: `"Smart Library" <${process.env.MAIL_USER}>`,
      to: to,
      subject: subjectText,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center;">
          <h2 style="color: #6366f1; margin-bottom: 10px;">${titleText}</h2>
          <p style="font-size: 16px; color: #0f172a;">Здравствуйте, <b>${fullName}</b>!</p>
          <p style="font-size: 14px; color: #64748b; line-height: 1.5;">${descriptionText}</p>
          <div style="background-color: #f8fafc; border: 2px dashed #6366f1; padding: 15px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a; margin: 20px auto; max-width: 210px; border-radius: 8px;">
            ${token}
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 15px;">Код действителен в течение 15 минут. Никому не сообщайте данный PIN-код.</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
