"use strict";

try {
  require("dotenv").config();
} catch (e) {
  // dotenv optional
}

const app = require("./src/app");
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Scholarship Finder Backend running successfully!`);
  console.log(`Web App & Frontend: http://localhost:${PORT}`);
  console.log(`API Base URL:       http://localhost:${PORT}/api`);
  console.log(`Health Check:       http://localhost:${PORT}/api/health`);
  console.log(`Scholarships API:   http://localhost:${PORT}/api/scholarships`);
  console.log(`Dashboard API:      http://localhost:${PORT}/api/dashboard`);
  console.log(`====================================================`);
});

process.on("SIGINT", () => {
  server.close(() => {
    console.log("Server closed gracefully");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server terminated");
    process.exit(0);
  });
});
