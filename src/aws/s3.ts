import { File } from '@koa/multer';
import AWS from 'aws-sdk';
import { v1 as uuidv1 } from 'uuid';
import { EntityType } from '../models';
import sharp from 'sharp';

const s3 = new AWS.S3();

export const upload = async (id: string, type: EntityType, { buffer }: File) => {
  const params = {
    Bucket: 'eventfully.photos',
    Key: `${type}/${id}/${uuidv1()}-big.jpg`,
    ContentType: 'image/jpeg',
  };
  const img = await sharp(buffer)
    .toFormat('jpeg')
    .jpeg({ quality: 100, force: true, progressive: true })
    .toBuffer();

  const thumbnail = await sharp(buffer)
    .resize({
      fit: sharp.fit.contain,
      height: 400,
    })
    .toFormat('jpeg')
    .jpeg({ quality: 80, force: true, progressive: true })
    .toBuffer();

  const imgUrl = await s3.upload({ ...params, Body: img }).promise();
  const thumbnailUrl = await s3
    .upload({ ...params, Key: `${type}/${id}/${uuidv1()}-small.jpg`, Body: thumbnail })
    .promise();

  return { imgUrl: imgUrl.Location, thumbnailUrl: thumbnailUrl.Location };
};

export const uploadUserPicture = async (id: string, { buffer }: File) => {
  const formatedPicture = await sharp(buffer)
    .toFormat('jpeg')
    .jpeg({ quality: 100, force: true, progressive: true })
    .toBuffer();

  const params = {
    Bucket: 'eventfully.photos',
    Key: `${EntityType.USER}/${id.replace('auth0|', '')}/picture.jpg`,
    Body: formatedPicture,
    ContentType: 'image/jpeg',
  };

  const picture = await s3.upload(params).promise();

  return { picture: picture.Location };
};
