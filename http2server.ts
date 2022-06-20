import * as http from 'http2';
import * as fs from 'fs';

const option: http.SecureServerOptions = {
  key: fs.readFileSync('./assert/key.pem'),
  cert: fs.readFileSync('./assert/cert.pem'),
  allowHTTP1: false,
};

interface CreateServerArgs {
  port?: number
  host?: string
  onRequest: (req: http.Http2ServerRequest, res: http.Http2ServerResponse) => Promise<RequestResult | void>
}

interface RequestResult {
  data?: string | Buffer
  headers?: http.OutgoingHttpHeaders
  statusCode?: number
}

export const getRequestBody = (request: http.Http2ServerRequest) => {
  return new Promise<Buffer>(resolve => {

    const contentLength = parseInt(
      request.headers[http.constants.HTTP2_HEADER_CONTENT_LENGTH] as string,
      10
    );
    let currentLength = 0;

    const chunks: Buffer[] = [];
    const end = () => {
      const data = Buffer.concat(chunks);
      resolve(data);
    };

    request.on('end', end);

    request.on('data', (chunk) => {
      const data = chunk as Buffer;

      chunks.push(data);
      currentLength += data.byteLength;
      console.log('getRequestBody on data', { contentLength, currentLength });

      if (
        Number.isFinite(contentLength)
        &&
        currentLength >= contentLength
      ) {
        end();
      }
    });
  })
};

export const createServer = ({ port = 8722, host = '0.0.0.0', onRequest }: CreateServerArgs) => {
  return http.createSecureServer(option, async (request, response) => {
    const responseData = await onRequest(request, response);
    if (responseData == null) {
      return;
    }
    const statusCode = responseData.statusCode != null ? responseData.statusCode : 200;
    const resHeaders: http.OutgoingHttpHeaders = responseData.headers != null ? responseData.headers : {
      [http.constants.HTTP2_HEADER_ACCESS_CONTROL_ALLOW_ORIGIN]: '*',
      [http.constants.HTTP2_HEADER_ACCESS_CONTROL_ALLOW_HEADERS]: '*',
      [http.constants.HTTP2_HEADER_CACHE_CONTROL]: 'public, max-age=0',
      [http.constants.HTTP2_HEADER_CONTENT_TYPE]: 'text/plain; charset=UTF-8',
    };

    response.writeHead(statusCode, {
      'Server': `My server Node.js/${process.version}`,
      ...resHeaders
    })
    response.end(responseData.data || Uint8Array.from([]));
  }).listen({
    port,
    host,
  }, () => {
    console.log('server is running:', host, port, `https://localhost:${port}`);
  });
};
