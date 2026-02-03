#!/usr/bin/env node
require("dotenv").config({ path: ".env.local" });
require("child_process").spawn("npx", ["prisma", "studio"], {
  stdio: "inherit",
});
