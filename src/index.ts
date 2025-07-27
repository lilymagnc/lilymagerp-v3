
import {onRequest} from 'firebase-functions/v2/https';
import {setGlobalOptions} from 'firebase-functions/v2';
import next from 'next';
import path from 'path';

// AI-related imports
import * as ai from './ai/dev';

// Re-export all AI flows
export * from './ai/dev';

// Set global options for Firebase Functions v2
setGlobalOptions({maxInstances: 10, region: 'us-central1'});

const nextjsDistDir = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  '.next'
);

const nextServer = next({
  dev: false,
  conf: {
    distDir: nextjsDistDir,
  },
});
const nextjsHandle = nextServer.getRequestHandler();

export const serverV2 = onRequest((req, res) => {
  return nextServer.prepare().then(() => nextjsHandle(req, res));
});
