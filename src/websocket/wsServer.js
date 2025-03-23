import { WebSocketServer } from 'ws';

function setupWebSocketServer(server) {
    const wss = new WebSocketServer({ server });
    const clients = new Map();

    wss.on('connection', function connection(ws) {
        ws.on('message', function incoming(message) {
            try {
                const data = JSON.parse(message);
                if (data.type === 'clientId') {
                    clients.set(data.id, ws);
                    console.log('Client ID received:', data.id);
                }
            } catch (error) {
                console.error('Error processing client message:', error);
            }
        });

        ws.send(JSON.stringify({ 
            message: 'Connection established with server!',
            progress: 0,
            estimatedTime: 'Waiting for operation...'
        }));

        ws.on('close', function() {
            clients.forEach((client, clientId) => {
                if (client === ws) {
                    clients.delete(clientId);
                    console.log('Client instance removed:', clientId);
                }
            });
        });
    });

    return { wss, clients };
}

export default setupWebSocketServer;