import { Context } from 'koa';
import { errorResponse, response } from '../utils';
import nodemailer from 'nodemailer';
import mailgun from 'nodemailer-mailgun-transport';
import { Event } from '../models/event';
import { StatusCodes } from 'http-status-codes';
import * as dotenv from 'dotenv';

dotenv.config();

const { MAILGUN_API_KEY, MAILGUN_DOMAIN } = process.env;

export class EmailController {
  async send(ctx: Context, body: { event: Event; recipients: string[] }) {
    try {
      const auth = {
        auth: {
          api_key: MAILGUN_API_KEY,
          domain: MAILGUN_DOMAIN,
        },
      };

      const transporter = nodemailer.createTransport(mailgun(auth));

      const mailOptions = {
        from: body.event.host.email,
        to: body.recipients,
        subject: `${body.event.host.nickname} invites you to the ${body.event.title}`,
        text: 'Some invitation text...',
      };

      await transporter.sendMail(mailOptions);

      return response(ctx, StatusCodes.OK, body);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }
}
