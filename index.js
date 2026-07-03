// Configured live Render backend link from your active deployment
const MY_RENDER_API = 'https://video-downloader-fkzl.onrender.com';

async function fireCloudExtraction() {
    const inputUrl = document.getElementById('targetLink').value.trim();
    const logs = document.getElementById('loaderLogs');
    const resBox = document.getElementById('resultContainer');
    const btn = document.getElementById('runBtn');

    // 1. Validation Check
    if (!inputUrl) {
        logs.style.color = "#ef4444";
        logs.innerText = "Please input a live media URL link first.";
        return;
    }

    // 2. Loading State Initialization
    logs.style.color = "#6366f1";
    logs.innerText = "🔄 Connecting to your cloud server... (Note: If server was sleeping, it might take up to 30-50 seconds to wake up for the first request).";
    resBox.style.display = "none";
    btn.disabled = true;

    try {
        // 3. API Fetch Request with standard endpoint structure
        const endpoint = `${MY_RENDER_API}/api/extract?url=${encodeURIComponent(inputUrl)}`;
        const response = await fetch(endpoint);
        const data = await response.json();

        // 4. Checking Success Response Package
        if (data && data.success) {
            logs.innerText = ""; // Clear logs on success
            
            // Set dynamic metadata fields
            document.getElementById('mediaTitle').innerText = data.title;
            document.getElementById('metaPlatform').innerText = data.platform.toUpperCase();
            document.getElementById('metaDuration').innerText = data.duration;
            
            // Setup thumbnail display and thumbnail download link
            document.getElementById('mediaThumb').src = data.thumbnail;
            document.getElementById('dlThumbBtn').href = data.thumbnail;

            // Setup quick high-quality download triggers
            const quickDeck = document.getElementById('quickDeck');
            quickDeck.innerHTML = '';
            
            if (data.bestVideoLink) {
                quickDeck.innerHTML += `<a href="${data.bestVideoLink}" target="_blank" class="dl-badge prime-type">🎬 Download Highest Video (HD)</a>`;
            }
            if (data.bestAudioLink) {
                quickDeck.innerHTML += `<a href="${data.bestAudioLink}" target="_blank" class="dl-badge prime-type audio-type">🎵 Download Best Audio (MP3/M4A)</a>`;
            }

            // Populate all available formats dynamically inside the responsive table
            const tableBody = document.getElementById('formatsTableBody');
            tableBody.innerHTML = '';
            
            data.allAvailableFormats.forEach(stream => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="font-weight:bold; color: ${stream.type === 'Audio' ? '#f59e0b':'#10b981'};">${stream.type}</td>
                    <td>${stream.qualityLabel} (${stream.resolution})</td>
                    <td style="text-transform:uppercase;">${stream.extension}</td>
                    <td>${stream.fileSize}</td>
                    <td><a href="${stream.downloadLink}" target="_blank" class="dl-badge ${stream.type === 'Audio' ? 'audio-type':''}">Download</a></td>
                `;
                tableBody.appendChild(row);
            });

            // Make the result container visible smoothly
            resBox.style.display = "block";
        } else {
            logs.style.color = "#ef4444";
            logs.innerText = "API parsing block error. Please double-check the link privacy settings or try another video.";
        }
    } catch (err) {
        // Detailed error fallback if connection fails or timeouts
        logs.style.color = "#ef4444";
        logs.innerText = "Cloud connection failed. Please open your backend link once directly in a new tab to wake it up, then try again.";
        console.error("Extraction error log:", err);
    } finally {
        // Re-enable button after operation completes
        btn.disabled = false;
    }
}
