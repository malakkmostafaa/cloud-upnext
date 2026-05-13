function mockAuth(req, res, next) {
  const demoUser = req.headers["x-demo-user"] || "ali";

  const users = {
    ali: {
      userId: "ali",
      name: "Ali",
      email: "ali@upnext.com",
      role: "MANAGER",
      teamId: "all",
    },
    sara: {
      userId: "sara",
      name: "Sara",
      email: "sara@upnext.com",
      role: "EMPLOYEE",
      teamId: "frontend",
    },
    omar: {
      userId: "omar",
      name: "Omar",
      email: "omar@upnext.com",
      role: "EMPLOYEE",
      teamId: "backend",
    },
  };

  req.user = users[demoUser] || users.ali;
  next();
}

module.exports = mockAuth;