import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { createServer } from 'http';
import path from 'path';
import setupWebSocketServer from './websocket/wsServer.js';
import videoRoutes from './routes/video.routes.js';
import configRoutes from './routes/config.routes.js';

config();

const PORT = process.env.PORT || 3000;
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [];

const app = express();
const server = createServer(app);

app.use(bodyParser.json({ limit: '3000mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '3000mb' }));
app.use(helmet());

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { message: 'Too many requests, please try again later.' }
});
app.use(limiter);

app.use('/thumbnails', express.static(path.join('thumbnails')));

const { clients } = setupWebSocketServer(server);

app.get("/", (req, res) => {
    res.json({
        message: "API is running",
        status: "healthy"
    });
});

app.use('/video', videoRoutes(clients));
app.use('/config', configRoutes);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});