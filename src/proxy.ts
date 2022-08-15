import net from 'net';
import tls from 'tls';

class ProxyServer {
    static defaultMaxFirstLineLength = 1024;
    static defaultMaxChunkLength = 4096;

    static defaultEntityTooLargeResponse = Buffer.from([
        `HTTP/1.1 413 Request Entity Too Large (maxFirstLineLength: ${ProxyServer.defaultMaxFirstLineLength})`,
        'Content-Type: text/plain',
        'Connection: close',
        `Content-Length: ${`Request Entity Too Large (maxFirstLineLength: ${ProxyServer.defaultMaxFirstLineLength})`.length}`,
        '',
        `Request Entity Too Large (maxFirstLineLength: ${ProxyServer.defaultMaxFirstLineLength})`,
        ''
    ].join('\r\n'));

    private server: net.Server;
    maxFirstLineLength = ProxyServer.defaultMaxFirstLineLength;
    maxChunkLength = ProxyServer.defaultMaxChunkLength;
    maxEntityTooLargeResponse = ProxyServer.defaultEntityTooLargeResponse;

    constructor() {
        this.server = new net.Server();
        this.server.on('connection', this.onConnection.bind(this));
    }

    setMaxFirstLineLength(maxFirstLineLength: number) {
        this.maxFirstLineLength = maxFirstLineLength;
    }

    setMaxChunkLength(maxChunkLength: number) {
        this.maxChunkLength = maxChunkLength;
    }

    setMaxEntityTooLargeResponse(maxEntityTooLargeResponse: Buffer) {
        this.maxEntityTooLargeResponse = maxEntityTooLargeResponse;
    }

    private onConnection(socket: net.Socket) {
        socket.once('data', (data: Buffer) => {
            if (data.length > this.maxChunkLength) {
                socket.end(this.maxEntityTooLargeResponse);
                return;
            }

            if (data.subarray(0, this.maxFirstLineLength).toString().indexOf('\r') === -1) {
                socket.end(this.maxEntityTooLargeResponse);
                return;
            }

            const regex = /^([A-Z]{3,7}) ((?:https?|wss?):\/\/[^\s]+) HTTP\/1\.[01]\r?\n/;

            const match = regex.exec(data.subarray(0, this.maxFirstLineLength).toString());

            if (!match) {
                socket.end(this.maxEntityTooLargeResponse);
                return;
            }

            const url = new URL(match[2]);
            const firstPayload = Buffer.concat([
                Buffer.from(match[1] + ' ' + url.pathname + (url.search || '') + ' HTTP/1.1\r\n'),
                data.subarray(data.indexOf(Buffer.from('\r\n')) + 2)
            ]);

            const secure = url.protocol === 'https:' || url.protocol === 'wss:';
            const port = url.port ? parseInt(url.port) : secure ? 443 : 80;

            let ProxyServerSocket: net.Socket | tls.TLSSocket;

            if (secure) {
                ProxyServerSocket = new tls.TLSSocket(ProxyServerSocket);
            } else {
                ProxyServerSocket = new net.Socket();
            }

            ProxyServerSocket.on('error', () => {
                socket.destroy();
            });

            ProxyServerSocket.connect(port, url.hostname, () => {
                ProxyServerSocket.write(firstPayload);
                socket.pipe(ProxyServerSocket);
                ProxyServerSocket.pipe(socket);
            });

            socket.on('error', () => {
                ProxyServerSocket.destroy();
            });
        });
    }

    listen(port: number, cb?: () => void) {
        this.server.listen(port, cb);
    }

    close() {
        this.server.close();
    }
}

export default ProxyServer;
