// Preload audio files for playback
const audioFiles = {
    hold: new Audio(chrome.runtime.getURL('assets/audio/hold.mp3')),
    release: new Audio(chrome.runtime.getURL('assets/audio/release.mp3')),
};

// Preload and decode audio files
Object.values(audioFiles).forEach((audio) => {
    audio.load(); // Load the audio file into memory
    audio.muted = true; // Mute it to avoid user hearing it
    audio.play()
        .then(() => {
            audio.pause(); // Immediately pause after playing
            audio.muted = false; // Unmute for normal playback
            console.log(`Preloaded and decoded ${audio.src}`);
        })
        .catch((error) => {
            console.warn(`Error preloading ${audio.src}:`, error);
        });
});


// Cached mute state
let isMuted = false;

// Update cached mute state when notified by background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === 'updateMuteState') {
        isMuted = message.isMuted;
        console.log(`Mute state updated in offscreen: ${isMuted}`);
        sendResponse({ status: 'Mute state updated' });
    }

    if (message.command === 'playAudio' && audioFiles[message.type]) {
        if (!isMuted) {
            const audio = audioFiles[message.type];
            audio.currentTime = 0; // Ensure playback starts from the beginning
            audio.play()
                .then(() => {
                    console.log(`Playing ${message.type} audio.`);
                    sendResponse({ status: 'Audio played' });
                })
                .catch((error) => {
                    console.error('Audio playback error:', error);
                    sendResponse({ status: 'Audio playback error' });
                });
        } else {
            console.log('Audio is muted, not playing.');
            sendResponse({ status: 'Muted, audio not played' });
        }
        return true; // Keep the message channel open for async responses
    }
});
