const { PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const docClient = require("../db/dynamo");

const COMMENTS_TABLE = process.env.COMMENTS_TABLE || "upnext-comments";

async function createComment({ taskId, user, text }) {
  if (!text || !text.trim()) {
    const error = new Error("Comment text is required");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();

  const comment = {
    taskId,
    commentId: uuidv4(),
    authorId: user.userId,
    authorName: user.name || user.email,
    authorEmail: user.email,
    text: text.trim(),
    createdAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: COMMENTS_TABLE,
      Item: comment,
    })
  );

  return comment;
}

async function getCommentsByTaskId(taskId) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: COMMENTS_TABLE,
      KeyConditionExpression: "taskId = :taskId",
      ExpressionAttributeValues: {
        ":taskId": taskId,
      },
      ScanIndexForward: true,
    })
  );

  return result.Items || [];
}

module.exports = {
  createComment,
  getCommentsByTaskId,
};