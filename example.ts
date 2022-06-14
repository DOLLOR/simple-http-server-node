import * as httpserver from './httpServer';
import * as http2server from './http2server';

httpserver.createServer({
  port: 9302,
  onRequest: async (req, res) => {
    const data = await httpserver.getRequestBody(req);
    console.log(
      req.method,
      req.url,
      req.headers,
      data.toString(),
    );
    return {
      data: 'ok',
    };
  }
});

http2server.createServer({
  port: 9303,
  onRequest: async (req, res) => {
    const data = await httpserver.getRequestBody(req);
    console.log(
      req.method,
      req.url,
      req.headers,
      data.toString(),
    );
    return {
      data: 'ok',
    };
  }
});
