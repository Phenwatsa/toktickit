import "@testing-library/jest-dom";
import { beforeEach } from "vitest";

beforeEach((context) => {
  const filePath = context.task.file?.name || "";
  const g = globalThis as any;
  if (!g.process) g.process = { env: {} };
  if (!g.process.env) g.process.env = {};

  if (filePath.includes("lab-03")) {
    g.process.env.LAB3_TEST_MODE = "true";
  } else {
    g.process.env.LAB3_TEST_MODE = "false";
  }
});


