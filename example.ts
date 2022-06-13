import * as httpserver from './httpServer';
import * as http2server from './http2server';

httpserver.createServer({
  port: 9302,
  onRequest: async ({ headers, data, requestInfo }) => {
    console.log(requestInfo, headers, data.toString());
    return {
      data: 'ok',
    };
  }
});

http2server.createServer({
  port: 9303,
  onRequest: async ({ headers, data, requestInfo }) => {
    console.log(requestInfo, headers, data.toString());
    return {
      data: 'ok',
    };
  }
});
