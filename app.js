const http = require('http');
const url = require('url');
const net = require('net');

const port = process.env.PORT || 3000

// HTTP
const server =  http.createServer((req, res) => {
    const requestUrl = req.url;
    console.info(req.method, requestUrl);

    const parsedUrl = requestUrl.includes('//') ? url.parse(requestUrl) : url.parse(`//${requestUrl}`, false, true)

    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: req.method,
        headers: req.headers
    }

    const proxyRequest = http.request(options, (resProxy) => {
        res.writeHead(resProxy.statusCode, resProxy.statusMessage, resProxy.headers)
        resProxy.pipe(res)
    })

    req.pipe(proxyRequest).on('error', (err) => {
        console.error(err);
    })
})

// HTTPS
server.on('connect', (req, clientSocket) => {
    const requestUrl = req.url;
    console.info(req.method, requestUrl);

    const parsedUrl = requestUrl.includes('//') ? url.parse(requestUrl) : url.parse(`//${requestUrl}`, false, true)
    const serverSocket = net.connect(parsedUrl.port, parsedUrl.hostname)
    serverSocket.on('connect', () => {
        clientSocket.write([
            'HTTP/1.1 200 Connection Established',
            'Proxy-agent: Node-Proxy'
        ].join('\r\n'));
        clientSocket.write('\r\n\r\n');

        clientSocket.on('error', (err) => {console.error(err);})

        serverSocket.pipe(clientSocket)
        clientSocket.pipe(serverSocket)
    })
    serverSocket.on('error', (err) => {console.error(err);})
})

const listener = server.listen(port, (err) => {
    if (err) {
        return console.log(err)
    }

    const info = listener.address()
        console.log(`Server running on address ${info.address} port ${info.port}`)
})