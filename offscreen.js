// Audio instances for playback
const audioFiles = {
  hold: new Audio('hold.mp3'),
  release: new Audio('release.mp3')
};

// Listen for messages from background.js to play audio
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === 'playAudio') {
        // Request mute state from background.js
        chrome.runtime.sendMessage({ command: 'getMuteState' }, (response) => {
            if (response && !response.isMuted) {
                audioFiles[message.type].play();
                console.log(`Playing ${message.type} audio.`);
                sendResponse({ status: 'Audio played' });
            } else {
                console.log("Audio is muted, not playing.");
                sendResponse({ status: 'Muted, audio not played' });
            }
        });
        return true;  // Keeps the message channel open for async response
    }
});
