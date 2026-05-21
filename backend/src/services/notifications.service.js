import { PublishCommand } from "@aws-sdk/client-sns";

import { snsClient } from "../aws/sns.js";

const TASK_ASSIGNED_TOPIC_ARN = process.env.TASK_ASSIGNED_TOPIC_ARN;

function createError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function publishTaskAssignedEvent({
  taskId,
  projectId,
  title,
  priority,
  deadline,
  assigneeId,
  teamId,
  createdBy,
  createdAt,
}) {
  if (!TASK_ASSIGNED_TOPIC_ARN) {
    throw createError("TASK_ASSIGNED_TOPIC_ARN is not configured", 500);
  }

  const event = {
    eventType: "TASK_ASSIGNED",
    taskId,
    projectId,
    title,
    priority,
    deadline,
    assigneeId,
    teamId,
    createdBy,
    createdAt,
  };

  const command = new PublishCommand({
    TopicArn: TASK_ASSIGNED_TOPIC_ARN,
    Subject: `New task assigned: ${title}`,
    Message: JSON.stringify(event),
    MessageAttributes: {
      eventType: {
        DataType: "String",
        StringValue: "TASK_ASSIGNED",
      },
      teamId: {
        DataType: "String",
        StringValue: teamId,
      },
      assigneeId: {
        DataType: "String",
        StringValue: assigneeId,
      },
    },
  });

  const result = await snsClient.send(command);

  return {
    messageId: result.MessageId,
    event,
  };
}