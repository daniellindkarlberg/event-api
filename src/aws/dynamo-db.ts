import AWS from 'aws-sdk';
import {
  DeleteItemInput,
  PutItemInput,
  QueryInput,
  UpdateItemInput,
} from 'aws-sdk/clients/dynamodb';

export const attributes = `id, #type, host, description, imageUrl, #name,
imagePositionTop, startDate, endDate, #text, sender, createdAt, #location`;
export const attributeNames = {
  '#text': 'text',
  '#type': 'type',
  '#name': 'name',
  '#location': 'location',
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
