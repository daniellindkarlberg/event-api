import { File } from '@koa/multer';
import AWS from 'aws-sdk';
import { EntityType } from 'aws-sdk/clients/iam';
import { v1 as uuidv1 } from 'uuid';

const s3 = new AWS.S3();

export const upload = async (
  id: string,
  type: EntityType,
  { buffer, mimetype, originalname }: File,
) => {
  const params = {
    Bucket: 'images.dlk-event.site',
    Key: `${type}/${id}/${uuidv1()}${originalname}`,
    Body: buffer,
    ContentType: mimetype,
  };

  const data = await s3.upload(params).promise();

  return data.Location;
};
