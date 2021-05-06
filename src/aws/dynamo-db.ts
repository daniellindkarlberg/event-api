import AWS from 'aws-sdk';
import {
  DeleteItemInput,
  PutItemInput,
  QueryInput,
  UpdateItemInput,
} from 'aws-sdk/clients/dynamodb';

export enum Table {
  EVENT = 'Event',
}

export enum SecondaryIndex {
  EVENT_META_INDEX = 'event-meta-index',
  USER_EVENT_INDEX = 'user-event-index',
  USER_MESSAGE_INDEX = 'user-message-index',
}

export const attributes = `id, #text, #type, #name, #location, #email, host, description,
 startDate, endDate, sender, createdAt, positionTop, photo, imgUrl, thumbnailUrl,
 theme, privacy, nickname, username, picture, category, reply, replyTo, originalMessage, attending`;
export const attributeNames = {
  '#text': 'text',
  '#type': 'type',
  '#name': 'name',
  '#location': 'location',
  '#email': 'email',
};

const dynamoDB = new AWS.DynamoDB.DocumentClient();

export const put = async (params: PutItemInput) => await dynamoDB.put(params).promise();

export const update = async (params: UpdateItemInput) => await dynamoDB.update(params).promise();

export const query = async (params: QueryInput) =>
  await dynamoDB
    .query({
      ...params,
      ExpressionAttributeNames: attributeNames,
      ProjectionExpression: attributes,
    })
    .promise();

export const remove = async (params: DeleteItemInput) => await dynamoDB.delete(params).promise();

export const generateUpdateParams = (
  pk: string,
  sk: string,
  updateExpression: string,
  expressionAttributeValues: { [key: string]: string | number },
) => {
  return {
    TableName: Table.EVENT,
    Key: {
      pk,
      sk,
    },
    UpdateExpression: `set ${updateExpression}`,
    ExpressionAttributeValues: expressionAttributeValues,
  };
};

export const generateQueryParams = (
  keyConditionExpression: string,
  expressionAttributeValues: { [key: string]: string },
  indexName?: string,
) => {
  return {
    TableName: 'Event',
    ...(indexName && { IndexName: indexName }),
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  };
};
