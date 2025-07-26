import { https, setGlobalOptions } from 'firebase-functions/v2';
import next from 'next';
import path from 'path';
setGlobalOptions({ maxInstances: 10 });
const nextjsDistDir = path.join(path.dirname(new URL(import.meta.url).pathname), '.next');
const nextServer = next({
    dev: false,
    conf: {
        distDir: nextjsDistDir,
    },
});
const nextjsHandle = nextServer.getRequestHandler();
export const server = https.onRequest((req, res) => {
    return nextServer.prepare().then(() => nextjsHandle(req, res));
});
