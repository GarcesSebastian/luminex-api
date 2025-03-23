// routes/config.routes.js
import express from 'express';
import * as globals from "../config/globals.js";

const router = express.Router();

router.post("/quality", (req, res) => {
    if (!req.body) {
        return res.status(400).json({ message: "No data provided" });
    }

    const { state } = req.body;
    
    if (typeof state !== 'boolean') {
        return res.status(400).json({ message: "Invalid state value, boolean expected" });
    }
    
    globals.setQualityMax(state);

    res.json({ 
        message: "Quality setting updated successfully", 
        quality: globals.IS_QUALITY_MAX 
    });
});

router.post("/generateVideos", (req, res) => {
    if (!req.body) {
        return res.status(400).json({ message: "No data provided" });
    }

    const { state } = req.body;
    
    if (typeof state !== 'boolean') {
        return res.status(400).json({ message: "Invalid state value, boolean expected" });
    }
    
    globals.setGenerateVideos(state);

    res.json({ 
        message: "Generate videos setting updated successfully", 
        generate: globals.IS_GENERATE_VIDEOS 
    });
});

export default router;