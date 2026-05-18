import { randomUUID }
  from "crypto";

import {
  PutCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

import docClient
  from "../db/dynamo.js";

const TASKS_TABLE =
  process.env.TASKS_TABLE
  || "upnext-tasks";

/**
 * CREATE TASK
 */
export async function createTask(
  input,
  createdBy
) {

  const now =
    new Date().toISOString();

  const task = {

    taskId:
      randomUUID(),

    title:
      input.title,

    description:
      input.description,

    priority:
      input.priority,

    deadline:
      input.deadline,

    status:
      input.status || "To Do",

    assigneeName:
      input.assigneeName,

    teamName:
      input.teamName,

    createdBy,

    createdAt: now,

    updatedAt: now,
  };

  await docClient.send(

    new PutCommand({

      TableName:
        TASKS_TABLE,

      Item: task,

    })

  );

  return task;
}

/**
 * GET ALL TASKS
 */
export async function listTasks() {

  const { Items } =
    await docClient.send(

      new ScanCommand({

        TableName:
          TASKS_TABLE,

      })

    );

  return Items || [];
}

/**
 * UPDATE TASK
 */
export async function updateTask(
  taskId,
  updatedData
) {

  const updatedTask = {

    taskId,

    title:
      updatedData.title,

    description:
      updatedData.description,

    priority:
      updatedData.priority,

    deadline:
      updatedData.deadline,

    status:
      updatedData.status,

    assigneeName:
      updatedData.assigneeName,

    teamName:
      updatedData.teamName,

    createdBy:
      updatedData.createdBy,

    createdAt:
      updatedData.createdAt,

    updatedAt:
      new Date().toISOString(),
  };

  await docClient.send(

    new PutCommand({

      TableName:
        TASKS_TABLE,

      Item:
        updatedTask,

    })

  );

  return updatedTask;
}

/**
 * DELETE TASK
 */
export async function deleteTask(
  taskId
) {

  await docClient.send(

    new DeleteCommand({

      TableName:
        TASKS_TABLE,

      Key: {
        taskId,
      },

    })

  );

  return true;
}