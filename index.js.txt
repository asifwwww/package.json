const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

// Main Dynamic Extraction Endpoint
app.get('/api/extract', (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({ success: false, message: "URL parameter is required." });
    }

    console.log(`[*] Processing cloud extraction request for: ${videoUrl}`);

    // yt-dlp command to dump all raw metadata as clear JSON format
    const command = `yt-dlp --dump-json --no-warnings "${videoUrl}"`;

    exec(command, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`[-] yt-dlp Execution Error: ${error.message}`);
            return res.status(500).json({ success: false, message: "Failed to parse video. Link might be private or unsupported." });
        }

        try {
            const rawData = JSON.parse(stdout);
            
            // 1. Extract All Available Formats (Video, Audio, Different Qualities)
            const formatsDeck = [];
            if (rawData.formats) {
                rawData.formats.forEach(f => {
                    // Filter tracking formats that contain direct download links
                    if (f.url && (f.vcodec !== 'none' || f.acodec !== 'none')) {
                        formatsDeck.push({
                            formatId: f.format_id,
                            extension: f.ext || 'mp4',
                            resolution: f.resolution || (f.acodec !== 'none' && f.vcodec === 'none' ? 'Audio Only' : 'Dynamic'),
                            qualityLabel: f.format_note || `${f.height ? f.height + 'p' : 'HQ'}`,
                            fileSize: f.filesize ? (f.filesize / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown',
                            downloadLink: f.url,
                            type: f.vcodec === 'none' ? 'Audio' : 'Video'
                        });
                    }
                });
            }

            // 2. Extract Highest Quality Links Directly
            const highestVideo = formatsDeck.filter(f => f.type === 'Video').sort((a,b) => (parseInt(b.qualityLabel) || 0) - (parseInt(a.qualityLabel) || 0))[0];
            const highestAudio = formatsDeck.filter(f => f.type === 'Audio')[0];

            // 3. Compile Master Clean JSON Package to feed into Blogger Page
            const cleanPayload = {
                success: true,
                title: rawData.title || "Universal Cloud Media",
                duration: rawData.duration ? `${Math.floor(rawData.duration / 60)}m ${rawData.duration % 60}s` : 'Unknown',
                thumbnail: rawData.thumbnail || (rawData.thumbnails && rawData.thumbnails.length > 0 ? rawData.thumbnails[rawData.thumbnails.length - 1].url : ''),
                platform: rawData.extractor_key || 'Generic Direct Source',
                bestVideoLink: highestVideo ? highestVideo.downloadLink : null,
                bestAudioLink: highestAudio ? highestAudio.downloadLink : null,
                allAvailableFormats: formatsDeck
            };

            return res.json(cleanPayload);

        } catch (parseError) {
            console.error(`[-] JSON Parsing Matrix Failure: ${parseError.message}`);
            return res.status(500).json({ success: false, message: "Error compiling structural metadata." });
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Your Personal Video Downloader Engine Running on Port ${PORT}`);
});
