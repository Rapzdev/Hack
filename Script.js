// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, onValue, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyBJ7tJy_oSH7TPwyMHFP4Tq37_mQkscpHg",
    authDomain: "hack-battle.firebaseapp.com",
    projectId: "hack-battle",
    storageBucket: "hack-battle.firebasestorage.app",
    messagingSenderId: "422575576978",
    appId: "1:422575576978:web:e5ab8d71a270087c98934b",
    measurementId: "G-XGCWLRWT8Q"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Global Variables
let currentRoom = null;
let playerName = null;
let isAdmin = false;
let currentStep = 1;
let foundIp = '';
let targetParentwork = '';
let targetUrl = '';
let isBlocked = false;

// Navigation Functions
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Create Room
window.createRoom = function() {
    const nameInput = document.getElementById('playerName').value.trim();
    if (!nameInput) {
        alert('Sila masukkan nama anda!');
        return;
    }

    playerName = nameInput;
    const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    currentRoom = roomCode;
    isAdmin = true;

    const roomRef = ref(db, `rooms/${roomCode}`);
    set(roomRef, {
        admin: playerName,
        gameState: 'waiting',
        targetParentwork: 'googledd',
        targetUrl: 'https://example.com',
        winner: null,
        players: {
            [playerName]: {
                name: playerName,
                step: 0,
                finished: false
            }
        }
    });

    document.getElementById('roomCodeDisplay').textContent = roomCode;
    document.getElementById('adminSettings').style.display = 'block';
    document.getElementById('startGameBtn').style.display = 'block';
    
    setupRoomListener();
    showScreen('lobbyScreen');
}

// Join Room
window.joinRoom = function() {
    const nameInput = document.getElementById('playerName').value.trim();
    const roomCode = document.getElementById('roomCodeInput').value.trim().toUpperCase();
    
    if (!nameInput || !roomCode) {
        alert('Sila masukkan nama dan kod room!');
        return;
    }

    playerName = nameInput;
    currentRoom = roomCode;
    isAdmin = false;

    const playerRef = ref(db, `rooms/${roomCode}/players/${playerName}`);
    set(playerRef, {
        name: playerName,
        step: 0,
        finished: false
    });

    document.getElementById('roomCodeDisplay').textContent = roomCode;
    document.getElementById('adminSettings').style.display = 'none';
    document.getElementById('startGameBtn').style.display = 'none';
    
    setupRoomListener();
    showScreen('lobbyScreen');
}

// Setup Room Listener
function setupRoomListener() {
    const roomRef = ref(db, `rooms/${currentRoom}`);
    onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // Update players list
        const players = data.players || {};
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';
        
        Object.values(players).forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <span>${player.name}</span>
                ${player.name === data.admin ? '<span class="player-badge">Admin</span>' : ''}
            `;
            playersList.appendChild(playerDiv);
        });

        document.getElementById('playerCount').textContent = Object.keys(players).length;

        // Update game state
        if (data.gameState === 'playing') {
            targetParentwork = data.targetParentwork;
            targetUrl = data.targetUrl;
            
            if (!isAdmin) {
                document.getElementById('enterGameBtn').style.display = 'block';
            }
        }

        // Check for winner
        if (data.winner) {
            document.getElementById('winnerName').textContent = data.winner + ' Menang!';
            showScreen('winnerScreen');
        }

        // Update settings if admin
        if (isAdmin) {
            document.getElementById('targetParentwork').value = data.targetParentwork;
            document.getElementById('targetUrl').value = data.targetUrl;
        }
    });
}

// Start Game (Admin only)
window.startGame = function() {
    if (!isAdmin) return;

    const selectedPw = document.getElementById('targetParentwork').value;
    const selectedUrl = document.getElementById('targetUrl').value;

    const roomRef = ref(db, `rooms/${currentRoom}`);
    update(roomRef, {
        gameState: 'playing',
        targetParentwork: selectedPw,
        targetUrl: selectedUrl
    });

    targetParentwork = selectedPw;
    targetUrl = selectedUrl;
    
    enterGame();
}

// Enter Game
window.enterGame = function() {
    document.getElementById('gameTargetPw').textContent = targetParentwork;
    document.getElementById('gameTargetUrl').textContent = targetUrl;
    currentStep = 1;
    updateStepInstructions();
    showScreen('gameScreen');
}

// Update Step Instructions
function updateStepInstructions() {
    const instructions = document.getElementById('stepInstructions');
    document.getElementById('currentStep').textContent = currentStep + '/4';

    switch(currentStep) {
        case 1:
            instructions.innerHTML = `
                <p>Langkah 1: Cari alamat IP</p>
                <p style="margin-top: 0.5rem;">Taip arahan:</p>
                <code>Parentwork = ${targetParentwork}
Url = ${targetUrl}
Find.ip.url.parent()</code>
            `;
            document.getElementById('addonsPanel').style.display = 'none';
            break;
        case 2:
            instructions.innerHTML = `
                <p style="color: #34d399;">✓ IP Ditemui: ${foundIp}</p>
                <p style="margin-top: 0.5rem;">Langkah 2: Pilih Addon (pilihan)</p>
            `;
            document.getElementById('addonsPanel').style.display = 'block';
            break;
        case 3:
            instructions.innerHTML = `
                <p>Langkah 3: Jalankan Serangan</p>
                <code>Rules = down
Ip = ${foundIp}
Parentwork = ${targetParentwork}
Choose.rules_in.ip_pw.parentwork()
Start all()
Started addon</code>
            `;
            document.getElementById('addonsPanel').style.display = 'none';
            break;
        case 4:
            instructions.innerHTML = `
                <p style="color: #34d399;">✓ Serangan Berjaya!</p>
            `;
            break;
    }
}

// Execute Command
window.executeCommand = function() {
    if (isBlocked) return;

    const terminal = document.getElementById('terminalInput').value.toLowerCase().trim();

    if (currentStep === 1) {
        // Check for IP finding command
        if (terminal.includes('parentwork') && terminal.includes('url') && terminal.includes('find.ip')) {
            foundIp = `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
            
            currentStep = 2;
            updateStepInstructions();
            document.getElementById('terminalInput').value = '';
            updatePlayerProgress(2);
        } else {
            alert('Arahan tidak betul! Sila semak semula.');
        }
    } else if (currentStep === 3) {
        // Check for attack command
        if (terminal.includes('rules') && terminal.includes('ip') && 
            terminal.includes('parentwork') && terminal.includes('start')) {
            currentStep = 4;
            updateStepInstructions();
            updatePlayerProgress(4);
            declareWinner();
        } else {
            alert('Arahan tidak betul! Sila semak semula.');
        }
    }
}

// Update Player Progress
function updatePlayerProgress(step) {
    const playerRef = ref(db, `rooms/${currentRoom}/players/${playerName}`);
    update(playerRef, {
        step: step,
        finished: step === 4
    });
}

// Declare Winner
function declareWinner() {
    const roomRef = ref(db, `rooms/${currentRoom}`);
    update(roomRef, {
        winner: playerName
    });
}

// Use Addon
window.useAddon = function(addonId) {
    alert('Addon diaktifkan: ' + addonId);
    // In a real multiplayer game, this would affect other players
    
    if (addonId === 'kill_air') {
        // Simulate blocking effect on opponent
        setTimeout(() => {
            alert('Addon selesai!');
        }, 10000);
    }
}

// Skip Addon
window.skipAddon = function() {
    currentStep = 3;
    updateStepInstructions();
    document.getElementById('terminalInput').value = '';
}

// Simulate being blocked by opponent (for demo purposes)
function simulateBlock(duration) {
    isBlocked = true;
    document.getElementById('terminalInput').disabled = true;
    document.getElementById('executeBtn').disabled = true;
    document.getElementById('blockedMsg').style.display = 'block';

    setTimeout(() => {
        isBlocked = false;
        document.getElementById('terminalInput').disabled = false;
        document.getElementById('executeBtn').disabled = false;
        document.getElementById('blockedMsg').style.display = 'none';
    }, duration);
}

// Update settings (Admin only)
document.getElementById('targetParentwork')?.addEventListener('change', function() {
    if (isAdmin && currentRoom) {
        const roomRef = ref(db, `rooms/${currentRoom}`);
        update(roomRef, {
            targetParentwork: this.value
        });
    }
});

document.getElementById('targetUrl')?.addEventListener('change', function() {
    if (isAdmin && currentRoom) {
        const roomRef = ref(db, `rooms/${currentRoom}`);
        update(roomRef, {
            targetUrl: this.value
        });
    }
});
