import ProxyServer from './proxy';
import ProxyManager from './manager';
import axios from 'axios';

const proxyManager = new ProxyManager();

const proxy1 = new ProxyServer();
const proxy2 = new ProxyServer();
const proxy3 = new ProxyServer();

proxyManager.addProxy('0.0.0.0', 8081);
proxyManager.addProxy('0.0.0.0', 8082);
proxyManager.addProxy('0.0.0.0', 8083);

proxy1.listen(8081, () => {
    console.log('Proxy 1 listening on port 8081');
});
proxy2.listen(8082, () => {
    console.log('Proxy 2 listening on port 8082');
});
proxy3.listen(8083, () => {
    console.log('Proxy 3 listening on port 8083');
});

proxyManager.listen(8080, () => {
    console.log('Proxy manager listening on port 8080');

    for (let i = 0; i < 3; i++) {
        axios.get('https://httpbin.org/get', {
            proxy: {
                host: 'localhost',
                port: 8080
            }
        }).then(res => {
            console.log(res.data);
        });
    }
});
