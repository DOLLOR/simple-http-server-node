import http from 'http';

interface CreateServerArgs {
  port?: number
  host?: string
  onRequest: (o: OnRequestArgs) => Promise<RequestResult | void>
}

interface RequestResult {
  data?: string | Buffer
  headers?: http.OutgoingHttpHeaders
  statusCode?: number
}

interface OnRequestArgs {
  requestInfo: RequestInfo
  headers: http.IncomingHttpHeaders
  request: http.IncomingMessage
  response: http.ServerResponse
  data: Buffer
}

interface RequestInfo {
  method: string
  path: string
  host: string
}

export const createServer = ({ port = 8722, host = '0.0.0.0', onRequest }: CreateServerArgs) => {
  return http.createServer((request, response) => {
    // post body
    const chunks: Uint8Array[] = [];
    request.on('data', chunk => chunks.push(chunk));
    request.on('end', async () => {
      const data = Buffer.concat(chunks);
      const requestInfo: RequestInfo = {
        host: request.headers['host'],
        method: request.method,
        path: request.url,
      };
      const responseData = await onRequest({ requestInfo, headers: request.headers, request, response, data })
      if (responseData == null) {
        return;
      }
      const statusCode = responseData.statusCode != null ? responseData.statusCode : 200;
      const resHeaders: http.OutgoingHttpHeaders = responseData.headers != null ? responseData.headers : {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Cache-Control': 'public, max-age=0',
        'Content-Type': 'text/plain; charset=UTF-8',
      };

      response.writeHead(statusCode, {
        'Server': `My server Node.js/${process.version}`,
        ...resHeaders
      })
      response.end(responseData.data);
    });
  }).listen({
    port,
    host,
  }, () => {
    console.log('server is running:', host, port, `http://localhost:${port}`);
  });
};
