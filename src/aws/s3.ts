import { File } from '@koa/multer';
import AWS from 'aws-sdk';
import { v1 as uuidv1 } from 'uuid';
import { EntityType } from '../models';
import sharp from 'sharp';

const s3 = new AWS.S3();

export const upload = async (
  id: string,
  type: EntityType,
  { buffer, mimetype, originalname }: File,
) => {
  const params = {
    Bucket: 'images.dlk-event.site',
    Key: `${type}/${id}/${uuidv1()}-big-${originalname}`,
    Body: buffer,
    ContentType: mimetype,
  };
  const imgUrl = await s3.upload(params).promise();
  const thumbnail = await sharp(buffer)
    .resize({
      fit: sharp.fit.contain,
      width: 400,
    })
    .toBuffer();

  const thumbnailUrl = await s3
    .upload({ ...params, Key: `${type}/${id}/${uuidv1()}-small-${originalname}`, Body: thumbnail })
    .promise();

  return { imgUrl: imgUrl.Location, thumbnailUrl: thumbnailUrl.Location };
};
