import AWS from 'aws-sdk';
import { Promise } from 'bluebird';
import 'dotenv/config';

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

AWS.config.setPromisesDependency(Promise);
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: 'eu-north-1',
});

export * as db from './dynamo-db';
export * as s3 from './s3';
