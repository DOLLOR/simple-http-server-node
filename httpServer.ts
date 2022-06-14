import * as http from 'http';








interface CreateServerArgs {
  port?: number
  host?: string
  onRequest: (req: http.IncomingMessage, res: http.ServerResponse) => Promise<RequestResult | void>
}

interface RequestResult {
  data?: string | Buffer
  headers?: http.OutgoingHttpHeaders
  statusCode?: number
}

export const getRequestBody = (request: http.IncomingMessage) => {
  return new Promise<Buffer>(resolve => {
    const chunks: Uint8Array[] = [];
    request.on('data', chunk => chunks.push(chunk));
    request.on('end', () => {
      const data = Buffer.concat(chunks);
      resolve(data);
    });
  })
};

export const createServer = ({ port = 8722, host = '0.0.0.0', onRequest }: CreateServerArgs) => {
  return http.createServer(async (request, response) => {
    const responseData = await onRequest(request, response);
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
  }).listen({
    port,
    host,
  }, () => {
    console.log('server is running:', host, port, `http://localhost:${port}`);
  });
};
