import type { Plugin } from "@opencode-ai/plugin";
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export const StrategicCompactPlugin: Plugin = async ({ $ }) => {
  const counterFile = path.join(os.tmpdir(), `opencode-tool-count-${process.pid}`);
  const THRESHOLD = 50;
  
  // Initialize counter
  let count = 0;
  try {
    if (fs.existsSync(counterFile)) {
       const existing = fs.readFileSync(counterFile, 'utf8');
       count = parseInt(existing.trim(), 10);
    }
  } catch {
    // Ignore
  }
  
  return {
    "tool.execute.after": async (input, output) => {
      count++;
      
      try {
        fs.writeFileSync(counterFile, String(count));
      } catch {
        // Ignore write error
      }
      
      // Suggest compact after threshold
      if (count === THRESHOLD) {
        console.warn(
          `[StrategicCompact] ${THRESHOLD} tool calls reached - ` +
          `consider /compact if transitioning phases`
        );
      }
      
      // Suggest at regular intervals
      if (count > THRESHOLD && count % 25 === 0) {
        console.warn(
          `[StrategicCompact] ${count} tool calls - ` +
          `good checkpoint for /compact if context is stale`
        );
      }
    }
  }
}
