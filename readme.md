# rotating-http-proxy

This package provides a rotating HTTP proxy manager and basic proxy server. The proxy manager can be used to create a pool of HTTP proxies that can be used to make requests. Both the manager and the proxy server support HTTP, HTTPS, WebSockets, and Secure WebSockets.

## Installation

```bash
npm install rotating-http-proxy
```

## Usage
```typescript

import { ProxyManager, ProxyServer } from 'rotating-http-proxy';

// Create a proxy manager
const manager = new ProxyManager();

// list of proxy servers to use
const proxyList = [
    new ProxyServer(),
    new ProxyServer(),
    new ProxyServer()
];

// start the proxies
for (let i = 1; i <= proxyList.length; i++) {
    const proxy = proxyList[i - 1];

    proxy.listen(8080 + i, () => {
        console.log(`Proxy server ${i} listening on port ${8080 + i}`);
    });
}

// add the proxies to the manager
for (let i = 0; i < proxyList.length; i++) {
    manager.addProxy('0.0.0.0', 8080 + i);
}

// start the manager
manager.listen(8080, () => {
    console.log('Proxy manager listening on port 8080');
});

// stop the manager
manager.close(() => {
    console.log('Proxy manager closed');
});

// stop the proxies
for (let i = 0; i < proxyList.length; i++) {
    proxyList[i].close(() => {
        console.log(`Proxy server ${i} closed`);
    });
}
```

## License

MIT
