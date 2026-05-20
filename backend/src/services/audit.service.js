import docClient from "../db/dynamo.js";

import {
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME =
  "AuditLogs";

export async function createAuditLog(log) {

  try {

    await docClient.send(

      new PutCommand({

        TableName:
          TABLE_NAME,

        Item: log,

      })

    );

    console.log(
      "AUDIT LOG SAVED"
    );

  } catch (error) {

    console.error(
      "AUDIT LOG ERROR:",
      error
    );

  }

}