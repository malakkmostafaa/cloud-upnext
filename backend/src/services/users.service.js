import {
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import { docClient } from "../db/dynamo.js";
import { Tables } from "../config/tables.js";

const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "eu-central-1",
});

async function listUsers() {
  const { Items } = await docClient.send(
    new ScanCommand({
      TableName: Tables.USERS,
    })
  );

  return Items || [];
}

async function saveUser(user) {
  const now = new Date().toISOString();

  const item = {
    userId: user.username || user.email,
    username: user.username || user.email,
    email: user.email,
    role: user.role || "EMPLOYEE",
    teamId: user.teamId || null,
    teamName: user.teamName || null,
    createdAt: user.createdAt || now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: Tables.USERS,
      Item: item,
    })
  );

  return item;
}

async function assignUserToTeam(username, teamId, teamName) {
  const now = new Date().toISOString();

  await cognito.send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: username,
      UserAttributes: [
        {
          Name: "custom:teamId",
          Value: teamId,
        },
      ],
    })
  );

  const { Attributes } = await docClient.send(
    new UpdateCommand({
      TableName: Tables.USERS,
      Key: {
        userId: username,
      },
      UpdateExpression:
        "SET teamId = :teamId, teamName = :teamName, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":teamId": teamId,
        ":teamName": teamName,
        ":updatedAt": now,
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return Attributes;
}

export {
  listUsers,
  saveUser,
  assignUserToTeam,
};