import * as http2 from 'http2';
import * as fs from 'fs';

const HC = http2.constants;

interface CreateServerArgs {
  port?: number
  host?: string
  onRequest: (args: OnRequestArgs) => Promise<any>
}

interface OnRequestArgs {
  requestInfo: RequestInfo
  stream: http2.ServerHttp2Stream,
  headers: http2.IncomingHttpHeaders
  data: Buffer
}

interface RequestInfo {
  method: string
  path: string
  host: string
}

export const getRequestBody = (
  stream: http2.ServerHttp2Stream,
) => {
  return new Promise<Buffer>(resolve => {
    const chunks: Uint8Array[] = [];
    stream.on('data', chunk => chunks.push(chunk as Exclude<typeof chunk, string>));

    stream.on('end', () => {
      const data = Buffer.concat(chunks);
      resolve(data);
    });
  });
};

export const createServer = ({ port = 8722, host = '0.0.0.0', onRequest }: CreateServerArgs) => {
  const server = http2.createSecureServer({
    key: fs.readFileSync('./assert/key.pem'),
    cert: fs.readFileSync('./assert/cert.pem'),
    allowHTTP1: false,
  });

  server.on('error', err => console.log(err));

  server.listen(port, host, () => {
    console.log(`server start: https://localhost:${port}`);
  });

  server.on('stream', async (stream, headers, flags) => {
    const data = await getRequestBody(stream);
    const requestInfo: RequestInfo = {
      method: headers[HC.HTTP2_HEADER_METHOD],
      path: headers[HC.HTTP2_HEADER_PATH],
      host: headers[HC.HTTP2_HEADER_AUTHORITY],
    };
    const responseData = await onRequest({ requestInfo, stream, headers, data });
    stream.respond({
      server: `Node.js/${process.version}`,
      [HC.HTTP2_HEADER_STATUS]: HC.HTTP_STATUS_OK,
      [HC.HTTP2_HEADER_ACCESS_CONTROL_ALLOW_ORIGIN]: '*',
      [HC.HTTP2_HEADER_ACCESS_CONTROL_ALLOW_HEADERS]: '*',
      [HC.HTTP2_HEADER_CACHE_CONTROL]: 'public, max-age=0',
      [HC.HTTP2_HEADER_CONTENT_TYPE]: 'text/plain; charset=UTF-8',
    });
    stream.end(responseData);
  });
};

// example
createServer({
  port: 9302,
  onRequest: async ({ requestInfo, stream, data, headers }) => {
    const postText = data.toString();
    console.log(requestInfo, postText);
    return `from http2: ${postText}`;
  },
});
