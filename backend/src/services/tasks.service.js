const { GetCommand } = require("@aws-sdk/lib-dynamodb");
const docClient = require("../db/dynamo");

const TASKS_TABLE = process.env.TASKS_TABLE || "upnext-tasks";

async function getTaskById(taskId) {
  const result = await docClient.send(
    new GetCommand({
      TableName: TASKS_TABLE,
      Key: { taskId },
    })
  );

  return result.Item || null;
}

module.exports = {
  getTaskById,
};