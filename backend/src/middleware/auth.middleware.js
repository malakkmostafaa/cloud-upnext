import jwt from "jsonwebtoken";
import axios from "axios";
import jwkToPem from "jwk-to-pem";

let pems = null;

async function getPems() {

  if (pems) return pems;

  const region =
    process.env.AWS_REGION;

  const userPoolId =
    process.env.COGNITO_USER_POOL_ID;

  const url =
    `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

  const response =
    await axios.get(url);

  pems = {};

  response.data.keys.forEach((key) => {

    pems[key.kid] =
      jwkToPem(key);

  });

  return pems;

}

export async function authenticateToken(
  req,
  res,
  next
) {

  try {

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {

      return res.status(401).json({
        message: "Missing token",
      });

    }

    const token =
      authHeader.split(" ")[1];

    const decoded =
      jwt.decode(token, {
        complete: true,
      });

    if (!decoded) {

      return res.status(401).json({
        message: "Invalid token",
      });

    }

    const pems =
      await getPems();

    const pem =
      pems[
        decoded.header.kid
      ];

    if (!pem) {

      return res.status(401).json({
        message: "Invalid token key",
      });

    }

    jwt.verify(
      token,
      pem,
      {
        algorithms: ["RS256"],
      },
      (err, payload) => {

        if (err) {

          console.error(
            "JWT Verify Error:",
            err
          );

          return res.status(401).json({
            message:
              "Token verification failed",
            error: err.message,
          });

        }

        /**
         * RBAC USER DATA
         */
        req.user = {

  id:
    payload.sub,

  email:
    payload.email,

  name:
    payload.name ||
    payload.email,

  role:
    (
      payload["custom:role"] ||
      "employee"
    )
      .toString()
      .toLowerCase()
      .trim(),

  team:
    (
      payload["custom:team"] ||
      "general"
    )
      .toString()
      .toLowerCase()
      .trim(),

};

        console.log(
          "Authenticated User:",
          req.user
        );

        next();

      }
    );

  } catch (error) {

    console.error(
      "Auth Middleware Error:",
      error
    );

    return res.status(500).json({
      message: error.message,
    });

  }

}