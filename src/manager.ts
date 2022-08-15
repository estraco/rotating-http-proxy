import net from 'net';

class ProxyManager {
    proxies: {
        ip: string;
        port: number;
    }[];
    proxyIndex: number;
    server: net.Server;

    constructor() {
        this.proxies = [];
        this.proxyIndex = 0;
        this.server = new net.Server();
        this.server.on('connection', this.onConnection.bind(this));
    }

    private onConnection(socket: net.Socket) {
        const proxy = this.proxies[this.proxyIndex++ % this.proxies.length];

        console.log('Proxying connection to ' + proxy.ip + ':' + proxy.port);

        const proxySocket = new net.Socket();

        proxySocket.on('error', () => {
            socket.destroy();
        });

        proxySocket.on('connect', () => {
            socket.pipe(proxySocket).pipe(socket);
        });

        proxySocket.connect(proxy.port, proxy.ip);
    }

    addProxy(ip: string, port: number) {
        this.proxies.push({ ip, port });
    }

    removeProxy(ip: string, port: number) {
        this.proxies = this.proxies.filter(proxy => proxy.ip !== ip || proxy.port !== port);
    }

    listen(port: number, cb?: () => void) {
        this.server.listen(port, cb);
    }

    close() {
        this.server.close();
    }
}

export default ProxyManager;
