#!/usr/bin/env node

import { runCli } from "../src/cli";

void runCli(process.argv).then((exitCode) => {
  if (exitCode !== 0) {
    process.exitCode = exitCode;
  }
});
