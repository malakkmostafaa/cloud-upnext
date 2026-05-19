const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "eu-central-1",
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

module.exports = docClient;