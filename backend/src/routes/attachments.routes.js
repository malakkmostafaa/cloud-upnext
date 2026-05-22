import express from "express";

import { requireAuth } from "../middleware/requireAuth.js";
import { requireEmployeeOrManager } from "../middleware/requireEmployeeOrManager.js";
import { requireTaskAccess } from "../middleware/requireTaskAccess.js";

import {
  generateAttachmentUploadUrl,
  saveTaskAttachment,
  generateAttachmentViewUrl,
  removeTaskAttachment,
} from "../services/attachments.service.js";

const router = express.Router();

router.post(
  "/tasks/:taskId/attachments/upload-url",
  requireAuth,
  requireEmployeeOrManager,
  requireTaskAccess,
  async (req, res, next) => {
    try {
      const { taskId } = req.params;
      const { filename, contentType } = req.body;

      const result = await generateAttachmentUploadUrl({
        taskId,
        filename,
        contentType,
      });

      return res.status(200).json({
        message: "Attachment upload URL generated successfully.",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/tasks/:taskId/attachments",
  requireAuth,
  requireEmployeeOrManager,
  requireTaskAccess,
  async (req, res, next) => {
    try {
      const { taskId } = req.params;
      const { key, filename, contentType, size } = req.body;

      const result = await saveTaskAttachment({
        taskId,
        key,
        filename,
        contentType,
        size,
        uploadedBy: req.user,
      });

      return res.status(201).json({
        message: "Attachment saved successfully.",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/tasks/:taskId/attachments/:attachmentId/url",
  requireAuth,
  requireEmployeeOrManager,
  requireTaskAccess,
  async (req, res, next) => {
    try {
      const { attachmentId } = req.params;

      const result = await generateAttachmentViewUrl({
        task: req.task,
        attachmentId,
      });

      return res.status(200).json({
        message: "Attachment URL generated successfully.",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/tasks/:taskId/attachments/:attachmentId",
  requireAuth,
  requireEmployeeOrManager,
  requireTaskAccess,
  async (req, res, next) => {
    try {
      const { taskId, attachmentId } = req.params;

      const task = await removeTaskAttachment({
        taskId,
        attachmentId,
      });

      return res.status(200).json({
        message: "Attachment removed successfully.",
        task,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;