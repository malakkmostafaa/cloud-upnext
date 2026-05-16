import "dotenv/config";
import { CognitoJwtVerifier } from "aws-jwt-verify";


const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "id",
  clientId: process.env.COGNITO_CLIENT_ID,
});

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Missing authorization token.",
      });
    }

    const token = authHeader.split(" ")[1];

    const payload = await verifier.verify(token);

    req.user = {
      userId: payload.sub,
      name: payload.name || payload.email,
      email: payload.email,
      role: payload["custom:role"],
      teamId: payload["custom:teamId"],
      teamName: payload["custom:teamId"],
    };

    next();
    } catch (error) {
    console.error("JWT verification error:", error);

    return res.status(401).json({
      message: "Invalid or expired token.",
      error: error.message,
    });
  }
}