// routes/video.routes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as utils from "../utils/ffmpeg.js";
import * as globals from "../config/globals.js";

const router = express.Router();

const includeTmp = "";
const upload = multer({ dest: includeTmp + 'uploads/' });

function videoRoutes(clients) {
    router.post("/upload", upload.single('file'), async (req, res) => {
        const clientId = req.headers['client-id'];

        if (!clients.has(clientId)) {
            return res.status(400).json({ message: "Invalid client ID" });
        }
        
        const client = clients.get(clientId);
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        
        const filePath = file.path;
        console.log('File uploaded:', filePath);
        
        const thumbnailsPath = path.join('thumbnails');
        const videosPath = path.join('videos');

        if (!fs.existsSync(thumbnailsPath)) {
            fs.mkdirSync(thumbnailsPath, { recursive: true });
        }

        if (!fs.existsSync(videosPath)) {
            fs.mkdirSync(videosPath, { recursive: true });
        }

        fs.readdirSync(thumbnailsPath).forEach(file => {
            if (file.startsWith('output') || file.startsWith('thumbnail')) {
                fs.unlinkSync(path.join(thumbnailsPath, file));
            }
        });

        if (client) {
            client.send(JSON.stringify({ 
                message: 'Generating thumbnails...', 
                progress: 0, 
                estimatedTime: "Calculating..." 
            }));
        }

        try {
            if (!globals.IS_GENERATE_VIDEOS) {
                const outputRoutes = await utils.generateThumbnails(filePath, 175, 100, 12, client);
                return res.json({ 
                    message: "Thumbnails generated successfully", 
                    images: outputRoutes 
                });
            }

            const videoPath = await utils.generateVideo(filePath, 175, 100, 12, client);
            fs.unlinkSync(path.join(includeTmp + 'videos/', videoPath[videoPath.length - 1]));
            return res.json({ 
                message: "Thumbnails generated successfully", 
                images: videoPath 
            });
        } catch (error) {
            console.error('Error generating thumbnails/video:', error);
            return res.status(500).json({ 
                message: "Error processing your request", 
                error: error.message 
            });
        }
    });

    router.post('/convert', upload.single('file'), async (req, res) => {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const clientId = req.headers['client-id'];
        
        if (!clients.has(clientId)) {
            return res.status(400).json({ message: "Invalid client ID" });
        }
        
        const client = clients.get(clientId);
        const inputPath = file.path;
        const resolution = req.body.resolution;
        const index = req.body.index;

        try {
            const resolutionVideo = await utils.getVideoResolution(inputPath);
            const outputPath = path.join('videos', `output_${resolution}.mp4`);
            const resolution_select = Number(resolution.split("p")[0]);

            if (Number(resolutionVideo.height == resolution_select && resolutionVideo.height < 1080)) {
                return res.status(400).json({
                    message: "Is quality", 
                    range: resolution_select
                });
            }

            if (index == 3 && resolutionVideo.height >= 1080) {
                return res.status(400).json({
                    message: "Is quality", 
                    range: 1080
                });
            }

            if (!fs.existsSync(outputPath)) {
                return res.status(400).json({
                    message: "File not found", 
                    range: resolution.split("p")[0]
                });
            }

            client.send(JSON.stringify({ 
                message: 'Conversion started in quality ' + resolution + '...', 
                progress: 100, 
                estimatedTime: "0 minutes" 
            }));

            res.download(outputPath, 'output.mp4', (err) => {
                if (err) {
                    console.error('Error during download:', err);
                    return res.status(500).send('Error during download');
                }

                fs.unlink(outputPath, (err) => {
                    if (err) console.error('Error deleting output file:', err);
                });
            });

            client.send(JSON.stringify({ 
                message: 'Conversion finished', 
                progress: 100, 
                estimatedTime: "0 minutes" 
            }));
        } catch (error) {
            console.error('Error during conversion:', error.message);
            res.status(500).json({ error: 'Error during conversion' });
        }
    });

    return router;
}

export default videoRoutes;