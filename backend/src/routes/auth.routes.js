import express from "express";

import {
  authenticateToken,
} from "../middleware/auth.middleware.js";

const router =
  express.Router();

router.get(
  "/me",

  authenticateToken,

  async (req, res) => {

    const email =
      req.user.email;

    let user = null;

    // REAL ROLE MAPPING

    if (
      email ===
      "ali@upnext.com"
    ) {

      user = {
        name: "Ali",
        role: "manager",
        team: "Frontend",
      };

    }
    else if (
      email ===
      "sara@upnext.com"
    ) {

      user = {
        name: "Sara",
        role: "employee",
        team: "Frontend",
      };

    }
    else if (
      email ===
      "omar@upnext.com"
    ) {

      user = {
        name: "Omar",
        role: "employee",
        team: "Backend",
      };

    }
    else {

      user = {
        name: "Unknown User",
        role: "No Role",
        team: "Unknown",
      };

    }

    res.json(user);

  }
);

export default router;