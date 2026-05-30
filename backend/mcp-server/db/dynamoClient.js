import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'us-east-1';

const client = new DynamoDBClient({ region });
export const docClient = DynamoDBDocumentClient.from(client);

export const TABLE_NAME = process.env.DYNAMO_TABLE_NAME || 'PortfolioData';
export const PROFILE_PK = process.env.PROFILE_PK || 'PROFILE#ethan-harter';
