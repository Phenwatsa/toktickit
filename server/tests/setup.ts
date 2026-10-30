import { beforeEach } from "vitest";

beforeEach((context) => {
  const filePath = context.task.file?.name || "";
  if (filePath.includes("lab-03")) {
    process.env.LAB3_TEST_MODE = "true";
  } else {
    process.env.LAB3_TEST_MODE = "false";
  }
});
