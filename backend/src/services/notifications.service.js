import { PublishCommand } from "@aws-sdk/client-sns";

import { snsClient } from "../aws/sns.js";

const TASK_ASSIGNED_TOPIC_ARN = process.env.TASK_ASSIGNED_TOPIC_ARN;

function createError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function buildEmailMessage({ title, priority, deadline, teamId }) {
  return `Hello!

You have been assigned a new task in UpNext.

Task Details:
--------------
Title:    ${title}
Priority: ${priority}
Deadline: ${deadline ? deadline.split("T")[0] : "No deadline"}
Team:     ${teamId}

Please log in to UpNext to view and manage your tasks.

This is an automated notification from UpNext.`;
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

  const emailMessage = buildEmailMessage({
    title,
    priority,
    deadline,
    teamId,
  });

  const command = new PublishCommand({
    TopicArn: TASK_ASSIGNED_TOPIC_ARN,
    Subject: `New task assigned: ${title}`,

    /**
     * This is the important part.
     *
     * Email receives readable text.
     * SQS receives JSON that Lambda can parse.
     */
    MessageStructure: "json",
    Message: JSON.stringify({
      default: JSON.stringify(event),
      email: emailMessage,
      sqs: JSON.stringify(event),
    }),

    MessageAttributes: {
      eventType: {
        DataType: "String",
        StringValue: "TASK_ASSIGNED",
      },
      teamId: {
        DataType: "String",
        StringValue: teamId || "unknown",
      },
      assigneeId: {
        DataType: "String",
        StringValue: assigneeId || "unknown",
      },
    },
  });

  const result = await snsClient.send(command);

  return {
    published: true,
    messageId: result.MessageId,
    event,
  };
}