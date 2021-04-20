import AWS from 'aws-sdk';

const ses = new AWS.SES({ region: 'eu-north-1' });

export const sendEmail = async (
  to: string,
  message: { subject: string; body: string; text: string },
) => {
  const params = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: `<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><style type="text/css" data-premailer="ignore">body{font-family: Helvetica, Arial, sans-serif !important; font-size: 13px;}</style></head><body>${message.body}</body></html>`,
        },
        Text: {
          Charset: 'UTF-8',
          Data: message.text,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: message.subject,
      },
    },
    ReturnPath: 'noreply@dart3.app',
    Source: 'noreply@dart3.app',
  };

  return await ses.sendEmail(params).promise();
};
