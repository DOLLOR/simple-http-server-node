import http from 'http';

type CreateServerArgs = {
  port?: number
  host?: string
  onRequest: (args: OnRequestArgs) => Promise<string>
}

type OnRequestArgs = {
  request: http.IncomingMessage
  response: http.ServerResponse
  data: Buffer
}

const createServer = ({ port = 8722, host = '0.0.0.0', onRequest }: CreateServerArgs) => {
  return http.createServer((request, response) => {
    // post body
    const chunks: Uint8Array[] = [];
    request.on('data', chunk => chunks.push(chunk));
    request.on('end', async () => {
      const data = Buffer.concat(chunks);
      const responseText = await onRequest({ request, response, data })
      response
        .writeHead(200, {
          'Server': `My server Node.js/${process.version}`,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Cache-Control': 'public, max-age=0',
        })
        .end(responseText);
    });
  }).listen({
    port,
    host,
  }, () => {
    console.log('server is running');
  });
};

let count = 0;
createServer({
  async onRequest({ request, response, data }) {
    console.log(
      `from ${request.connection.remoteAddress}:${request.connection.remotePort}`,
      request.method,
      request.url,
      request.headers,
      'Data: ',
      data.toString(),
      '\n---------------'
    );
    return `server ok!\r\n${++count}`;
  },
});
