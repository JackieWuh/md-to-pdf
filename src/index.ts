#!/usr/bin/env node

import { parseArgs, run } from './cli.js';

const args = parseArgs(process.argv);
await run(args);
