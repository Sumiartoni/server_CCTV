const WebSocket = require('ws');
const http = require('http');

// Heroku provides the port to listen on via an environment variable
const PORT = process.env.PORT || 8080;

// Create a standard HTTP server
const server = http.createServer();

// Attach the WebSocket server to the HTTP server
const wss = new WebSocket.Server({ server });

let cameraSocket = null;
const viewerSockets = new Set();

wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    if (path === '/camera') {
        console.log('Camera connected');
        cameraSocket = ws;

        ws.on('message', (message) => {
            // Broadcast the message to all viewers
            viewerSockets.forEach(viewer => {
                if (viewer.readyState === WebSocket.OPEN) {
                    viewer.send(message);
                }
            });
        });

        ws.on('close', () => {
            console.log('Camera disconnected');
            cameraSocket = null;
        });

        ws.on('error', (error) => {
            console.error('Camera WebSocket error:', error);
            cameraSocket = null;
        });

    } else if (path === '/viewer') {
        console.log('Viewer connected');
        viewerSockets.add(ws);
        console.log(`Total viewers: ${viewerSockets.size}`);

        ws.on('close', () => {
            console.log('Viewer disconnected');
            viewerSockets.delete(ws);
            console.log(`Total viewers: ${viewerSockets.size}`);
        });

        ws.on('error', (error) => {
            console.error('Viewer WebSocket error:', error);
            viewerSockets.delete(ws);
            console.log(`Total viewers: ${viewerSockets.size}`);
        });

    } else {
        console.log('Unknown connection type. Closing.');
        ws.close();
    }
});

// Start listening on the configured port
server.listen(PORT, () => {
    console.log(`WebSocket server started on port ${PORT}`);
});
