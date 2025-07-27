
import {onRequest} from 'firebase-functions/v2/https';
import {setGlobalOptions} from 'firebase-functions/v2';
import next from 'next';
import path from 'path';

// AI-related imports
// By importing, we make sure they are included in the deployment bundle.
import * as ai from './ai/dev.js';

// Re-export all AI flows so they can be managed by Firebase
export * from './ai/dev.js';

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
