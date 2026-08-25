// コンソールの無効化（要望による対応）
console.log = function() {};
console.warn = function() {};
console.error = function() {};
console.info = function() {};

// ============================================================================
// Web Audio API を使用した本格的サウンド・BGMシステム（外部依存なし）
// ============================================================================
class AudioSystem {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.bgmTimer = null;
        this.isPlayingBGM = false;
        this.step = 0;
        this.tempo = 140; 
        
        // Cメジャースケールの周波数
        this.f = {
            'C3':130.81, 'D3':146.83, 'E3':164.81, 'F3':174.61, 'G3':196.00, 'A3':220.00, 'B3':246.94,
            'C4':261.63, 'D4':293.66, 'E4':329.63, 'F4':349.23, 'G4':392.00, 'A4':440.00, 'B4':493.88,
            'C5':523.25, 'D5':587.33, 'E5':659.25, 'F5':698.46, 'G5':783.99, 'A5':880.00, 'B5':987.77,
            'C6':1046.50
        };

        // 勇ましいバトルBGMのシーケンス（32ステップループ）
        this.melody = [
            'C5', null, 'G4', null, 'C5', 'D5', 'E5', null,
            'F5', 'E5', 'D5', 'C5', 'D5', null, null, null,
            'E5', null, 'C5', null, 'A4', 'B4', 'C5', null,
            'D5', 'C5', 'B4', 'A4', 'G4', null, null, null
        ];
        this.bass = [
            'C3', 'C3', 'C3', 'C3', 'C3', 'C3', 'C3', 'C3',
            'G2', 'G2', 'G2', 'G2', 'G2', 'G2', 'G2', 'G2',
            'A2', 'A2', 'A2', 'A2', 'A2', 'A2', 'A2', 'A2',
            'F2', 'F2', 'F2', 'F2', 'G2', 'G2', 'G2', 'G2'
        ];
    }

    init() {
        if (this.initialized) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            this.ctx = new AudioContext();
            this.initialized = true;
        }
    }

    playTone(freq, type, duration, vol = 0.1) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playNoise(duration, vol) {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }

    // 効果音群
    playTyping() { this.playTone(800, 'sine', 0.1, 0.05); }
    playAttack() { this.playNoise(0.15, 0.2); }
    playDamage() { this.playNoise(0.3, 0.4); this.playTone(100, 'sawtooth', 0.3, 0.2); }
    playWin() {
        if(!this.ctx) return;
        this.stopBGM();
        setTimeout(() => this.playTone(this.f['C5'], 'square', 0.2, 0.1), 0);
        setTimeout(() => this.playTone(this.f['E5'], 'square', 0.2, 0.1), 200);
        setTimeout(() => this.playTone(this.f['G5'], 'square', 0.2, 0.1), 400);
        setTimeout(() => this.playTone(this.f['C6'], 'square', 0.6, 0.1), 600);
    }
    playLose() {
        if(!this.ctx) return;
        this.stopBGM();
        this.playTone(150, 'sawtooth', 0.5, 0.2);
        setTimeout(() => this.playTone(140, 'sawtooth', 0.8, 0.2), 400);
    }

    // BGM制御
    playBGM() {
        if (!this.ctx || this.isPlayingBGM) return;
        this.isPlayingBGM = true;
        this.step = 0;
        const stepTime = (60 / this.tempo) / 4; // 16分音符の長さ
        
        this.bgmTimer = setInterval(() => {
            let mNote = this.melody[this.step % 32];
            let bNote = this.bass[this.step % 32];
            
            if (mNote) this.playTone(this.f[mNote], 'square', stepTime * 1.5, 0.03);
            if (bNote) this.playTone(this.f[bNote] || 98, 'triangle', stepTime * 1.5, 0.05);
            if (this.step % 4 === 0) this.playNoise(0.05, 0.02); // ドラム代わりのノイズ
            
            this.step++;
        }, stepTime * 1000);
    }

    stopBGM() {
        if (this.bgmTimer) clearInterval(this.bgmTimer);
        this.isPlayingBGM = false;
    }
}
const audioSys = new AudioSystem();


// ============================================================================
// システム管理クラス群 (メモリ維持対象)
// ============================================================================
class GameDataManager {
    constructor() {
        this.loadData();
    }

    loadData() {
        this.playerName = localStorage.getItem('playerName') || null;
        
        const savedOwned = localStorage.getItem('ownedSlimes');
        this.ownedSlimes = savedOwned ? JSON.parse(savedOwned) : ["slime_01"];
        
        const savedEquipped = localStorage.getItem('equippedSlimes');
        this.equippedSlimes = savedEquipped ? JSON.parse(savedEquipped) : ["slime_01"]; 
        
        const savedFirstBattle = localStorage.getItem('isFirstBattle');
        this.isFirstBattle = savedFirstBattle === null ? true : (savedFirstBattle === 'true');

        const savedStreak = localStorage.getItem('winStreak');
        this.winStreak = savedStreak ? parseInt(savedStreak) : 0;

        const savedProfile = localStorage.getItem('playerProfile');
        this.playerProfile = savedProfile ? JSON.parse(savedProfile) : Array(196).fill('transparent');

        // 所持金のロード
        const savedMoney = localStorage.getItem('playerMoney');
        this.money = savedMoney ? parseInt(savedMoney) : 0;
    }

    savePlayerName(name) {
        this.playerName = name;
        localStorage.setItem('playerName', name);
    }

    saveGameData() {
        localStorage.setItem('ownedSlimes', JSON.stringify(this.ownedSlimes));
        localStorage.setItem('equippedSlimes', JSON.stringify(this.equippedSlimes));
        localStorage.setItem('isFirstBattle', this.isFirstBattle);
        localStorage.setItem('winStreak', this.winStreak);
        localStorage.setItem('playerProfile', JSON.stringify(this.playerProfile));
        localStorage.setItem('playerMoney', this.money); // お金のセーブ
    }

    getPlayerName() {
        return this.playerName;
    }

    resetAllData() {
        localStorage.clear();
        this.loadData();
    }
}

class BrainrotCollectionService {
    constructor() { this.collectionData = []; }
    logCollection(item) {}
}

class BrainrotCarryService {
    constructor() { this.carryStatus = false; }
    updateCarryStatus(status) { this.carryStatus = status; }
}

class MoneyDisplayController {
    constructor() {
        this.elements = [document.getElementById('money-display'), document.getElementById('shop-money-display')];
    }
    updateDisplay() {
        this.elements.forEach(el => {
            if (el) el.textContent = `所持金 ${gameData.money}円`;
        });
    }
}

// ============================================================================
// グローバル変数
// ============================================================================
let currentBattleSpeed = 1;
const gameData = new GameDataManager();
const collectionService = new BrainrotCollectionService();
const carryService = new BrainrotCarryService();
const moneyController = new MoneyDisplayController();

document.addEventListener('DOMContentLoaded', () => {
    // ---- UI要素の取得 ----
    const screenNameInput = document.getElementById('screen-name-input');
    const screenHome = document.getElementById('screen-home');
    const screenPlay = document.getElementById('screen-play');
    const screenEquip = document.getElementById('screen-equip');
    const screenShop = document.getElementById('screen-shop');
    const screenMatchmaking = document.getElementById('screen-matchmaking');
    const screenBattle = document.getElementById('screen-battle');
    
    const inputName = document.getElementById('player-name-input');
    const btnDecideName = document.getElementById('btn-decide-name');
    const displayPlayerName = document.getElementById('display-player-name');
    
    const btnSettings = document.getElementById('btn-settings');
    const btnPlay = document.getElementById('btn-play');
    const btnShop = document.getElementById('btn-shop');
    const btnEquip = document.getElementById('btn-equip');
    const btnCloseEquip = document.getElementById('btn-close-equip');
    const btnCloseShop = document.getElementById('btn-close-shop');

    const btnClosePlay = document.getElementById('btn-close-play');
    const btnVersusMode = document.getElementById('btn-versus-mode');
    const btnStoryMode = document.getElementById('btn-story-mode');

    const searchSlimeInput = document.getElementById('search-slime');
    const equippedList = document.getElementById('equipped-list');
    const ownedList = document.getElementById('owned-list');

    const battlePlayerTeam = document.getElementById('battle-player-team');
    const battleEnemyTeam = document.getElementById('battle-enemy-team');
    const typingJp = document.getElementById('typing-jp');
    const typeTyped = document.getElementById('type-typed');
    const typeUntyped = document.getElementById('type-untyped');
    const perfectBonusDisplay = document.getElementById('perfect-bonus-display');
    const battleMessage = document.getElementById('battle-message');
    const btnSpeedToggle = document.getElementById('btn-speed-toggle');

    const modalSettings = document.getElementById('modal-settings');
    const settingsNameInput = document.getElementById('settings-name-input');
    const btnUpdateName = document.getElementById('btn-update-name');
    const btnCloseSettings = document.getElementById('btn-close-settings');

    const modalCharaDetail = document.getElementById('modal-chara-detail');
    const btnCloseDetail = document.getElementById('btn-close-detail');

    const modalMessage = document.getElementById('modal-message');
    const messageText = document.getElementById('message-text');
    const btnCloseMessage = document.getElementById('btn-close-message');

    const btnInitStart = document.getElementById('btn-init-start');
    const modalResetStep1 = document.getElementById('modal-reset-step1');
    const btnResetYes1 = document.getElementById('btn-reset-yes1');
    const btnResetCancel1 = document.getElementById('btn-reset-cancel1');
    
    const modalResetStep2 = document.getElementById('modal-reset-step2');
    const resetCountdownText = document.getElementById('reset-countdown-text');
    const btnResetNext2 = document.getElementById('btn-reset-next2');
    
    const modalResetStep3 = document.getElementById('modal-reset-step3');
    const resetTargetName = document.getElementById('reset-target-name');
    const resetNameInput = document.getElementById('reset-name-input');
    const btnResetExecute = document.getElementById('btn-reset-execute');
    const btnResetCancel3 = document.getElementById('btn-reset-cancel3');

    const modalReward = document.getElementById('modal-reward');
    const rewardGridContainer = document.getElementById('reward-grid-container');
    const rewardMoneyText = document.getElementById('reward-money-text');
    const modalLose = document.getElementById('modal-lose');
    const btnCloseLose = document.getElementById('btn-close-lose');

    const btnEditProfile = document.getElementById('btn-edit-profile');
    const modalProfileEdit = document.getElementById('modal-profile-edit');
    const btnCloseProfile = document.getElementById('btn-close-profile');
    const btnSaveProfile = document.getElementById('btn-save-profile');

    // ログインユーザーUI要素
    const btnLoginUsers = document.getElementById('btn-login-users');
    const modalLoginUsers = document.getElementById('modal-login-users');
    const btnCloseLoginUsers = document.getElementById('btn-close-login-users');
    const tabCurrentLogin = document.getElementById('tab-current-login');
    const tabTodayLogin = document.getElementById('tab-today-login');
    const loginUsersList = document.getElementById('login-users-list');

    // ショップ購入ボタン
    const btnBuyMoney = document.getElementById('btn-buy-money');
    const btnBuyHammer = document.getElementById('btn-buy-hammer');

    // ========================================================================
    // 基本関数
    // ========================================================================
    function showScreen(screenElement) {
        audioSys.init(); // ユーザー操作をトリガーにAudioContextを初期化
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screenElement.classList.add('active');
    }

    function showMessage(text) {
        messageText.innerHTML = text;
        modalMessage.classList.add('active');
    }

    btnCloseMessage.addEventListener('click', () => {
        modalMessage.classList.remove('active');
    });

    function initGame() {
        moneyController.updateDisplay();
        if (gameData.getPlayerName()) {
            updateProfileUI();
            showScreen(screenHome);
        } else {
            showScreen(screenNameInput);
        }
    }

    // ========================================================================
    // ログインユーザー機能 (モックデータ生成)
    // ========================================================================
    const dummyNames = ["スライム太郎", "勇者ああああ", "伝説の剣士", "ぽんた", "プロゲーマー", "神エイム", "初心者", "匿名希望", "テストユーザー", "卍最強卍", "KUN", "もこう", "HIKAKIN", "草", "GG"];
    function generateDummyUsers(count) {
        let arr = [];
        for(let i=0; i<count; i++) {
            let n = dummyNames[Math.floor(Math.random() * dummyNames.length)] + Math.floor(Math.random()*100);
            arr.push(`<div style="padding: 10px; border-bottom: 2px dashed #000; font-size: 18px; font-weight: bold;">👤 ${n}</div>`);
        }
        return arr.join('');
    }

    btnLoginUsers.addEventListener('click', () => {
        audioSys.init();
        modalLoginUsers.classList.add('active');
        tabCurrentLogin.click(); // デフォルトタブを開く
    });

    btnCloseLoginUsers.addEventListener('click', () => {
        modalLoginUsers.classList.remove('active');
    });

    tabCurrentLogin.addEventListener('click', () => {
        tabCurrentLogin.classList.add('active-tab');
        tabTodayLogin.classList.remove('active-tab');
        loginUsersList.innerHTML = `<h3 style="margin-top:0;">現在ログイン中 (3人)</h3>` + generateDummyUsers(3);
    });

    tabTodayLogin.addEventListener('click', () => {
        tabTodayLogin.classList.add('active-tab');
        tabCurrentLogin.classList.remove('active-tab');
        loginUsersList.innerHTML = `<h3 style="margin-top:0;">今日ログインした人 (15人)</h3>` + generateDummyUsers(15);
    });

    // ========================================================================
    // ショップ機能
    // ========================================================================
    btnShop.addEventListener('click', () => {
        audioSys.init();
        moneyController.updateDisplay();
        showScreen(screenShop);
    });

    btnCloseShop.addEventListener('click', () => {
        showScreen(screenHome);
    });

    function buyItem(id, price, name) {
        if (gameData.money >= price) {
            gameData.money -= price;
            gameData.ownedSlimes.push(id);
            gameData.saveGameData();
            moneyController.updateDisplay();
            showMessage(`${name}を購入しました！<br>「装備」画面からセットしてね！`);
        } else {
            showMessage(`お金が足りません。<br>（不足: ${price - gameData.money}円）`);
        }
    }

    btnBuyMoney.addEventListener('click', () => buyItem('slime_08', 15000, 'マネースライム'));
    btnBuyHammer.addEventListener('click', () => buyItem('slime_09', 35000, 'ハンマースライム'));

    // ========================================================================
    // 名前入力・設定・プロフィールロジック
    // ========================================================================
    function renderProfileCanvas(canvas, profileData) {
        if (!canvas || !profileData) return;
        const ctx = canvas.getContext('2d');
        const cols = 14;
        const rows = 14;
        const cellW = canvas.width / cols;
        const cellH = canvas.height / rows;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for(let i=0; i<profileData.length; i++) {
            const color = profileData[i];
            if(color && color !== 'transparent') {
                const x = (i % cols) * cellW;
                const y = Math.floor(i / cols) * cellH;
                ctx.fillStyle = color;
                ctx.fillRect(x, y, cellW, cellH);
            }
        }
    }

    function updateProfileUI() {
        const name = gameData.getPlayerName();
        if (name) {
            displayPlayerName.textContent = `プロフィール：${name}`;
            const canvas = document.getElementById('display-profile-canvas');
            renderProfileCanvas(canvas, gameData.playerProfile);
        }
    }

    function validateAndSaveName(nameString, isInitialRegistration) {
        audioSys.init();
        const trimmedName = nameString.trim();
        if (trimmedName.length >= 3 && trimmedName.length <= 12) {
            gameData.savePlayerName(trimmedName);
            updateProfileUI();
            if (isInitialRegistration) showScreen(screenHome);
            return true;
        } else {
            showMessage('名前は3文字以上、<br>12文字以下で入力してください。');
            return false;
        }
    }

    btnDecideName.addEventListener('click', () => validateAndSaveName(inputName.value, true));
    btnSettings.addEventListener('click', () => {
        settingsNameInput.value = gameData.getPlayerName() || "";
        modalSettings.classList.add('active');
    });
    btnCloseSettings.addEventListener('click', () => modalSettings.classList.remove('active'));
    btnUpdateName.addEventListener('click', () => {
        if (validateAndSaveName(settingsNameInput.value, false)) {
            modalSettings.classList.remove('active');
            showMessage('名前を変更しました！');
        }
    });

    // --- プロフィールデモ機能 ---
    let currentProfileColor = '#000000';
    let tempProfileData = Array(196).fill('transparent');
    let isDrawing = false;

    // 省略せずに全て記述（カラーマップとデモデータ）
    const colorCodeMap = {
        '.': 'transparent', 'B': '#3498DB', 'R': '#E74C3C', 'G': '#2ECC71',
        'Y': '#F1C40F', 'K': '#000000', 'W': '#FFFFFF', 'M': '#9B59B6',
        'O': '#E67E22', 'C': '#87CEEB', 'S': '#BDC3C7'
    };

    const demoProfiles = [
        { name: "スライム", pattern: ["..............","..............","..............","..............",".....BBBB.....","...BBBBBBBB...","..BBB.BB.BBB..",".BBBB.BB.BBBB.",".BBBBBBBBBBBB.",".BBBBBBBBBBBB.",".BBBBBBBBBBBB.","..BBBBBBBBBB..","..............",".............."] },
        { name: "ハート", pattern: ["..............","..............","..RRR....RRR..",".RRRRR..RRRRR.",".RRRRRRRRRRRR.",".RRRRRRRRRRRR.","..RRRRRRRRRR..","...RRRRRRRR...","....RRRRRR....",".....RRRR.....","......RR......","..............","..............",".............."] }
    ];

    function parseDemoPattern(patternArray) {
        let result = [];
        for (let row of patternArray) {
            for (let char of row) {
                result.push(colorCodeMap[char] || 'transparent');
            }
        }
        return result;
    }

    function updateGridDisplay() {
        const grid = document.getElementById('profile-grid');
        Array.from(grid.children).forEach((cell, index) => {
            cell.style.backgroundColor = tempProfileData[index];
        });
    }

    function initProfileEditor() {
        const demoContainer = document.getElementById('demo-profiles-container');
        demoContainer.innerHTML = '';
        demoProfiles.forEach(demo => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-blue btn-small';
            btn.textContent = demo.name;
            btn.addEventListener('click', () => {
                tempProfileData = parseDemoPattern(demo.pattern);
                updateGridDisplay();
            });
            demoContainer.appendChild(btn);
        });

        const paletteColors = ['#000000', '#FFFFFF', '#E74C3C', '#3498DB', '#2ECC71', '#F1C40F', '#9B59B6', '#E67E22', '#87CEEB', 'transparent'];
        const paletteContainer = document.getElementById('color-palette');
        paletteContainer.innerHTML = '';
        
        paletteColors.forEach(color => {
            const colorBtn = document.createElement('div');
            colorBtn.style.width = '30px';
            colorBtn.style.height = '30px';
            colorBtn.style.backgroundColor = color === 'transparent' ? '#FFF' : color;
            colorBtn.style.border = color === 'transparent' ? '2px dashed #000' : '2px solid #000';
            colorBtn.style.cursor = 'pointer';
            colorBtn.style.boxSizing = 'border-box';
            
            if (color === currentProfileColor) {
                colorBtn.style.transform = 'scale(1.2)';
                colorBtn.style.borderColor = '#FF0000';
            }

            colorBtn.addEventListener('click', () => {
                currentProfileColor = color;
                Array.from(paletteContainer.children).forEach(btn => {
                    btn.style.transform = 'scale(1)';
                    btn.style.borderColor = btn.dataset.color === 'transparent' ? '2px dashed #000' : '2px solid #000';
                });
                colorBtn.style.transform = 'scale(1.2)';
                colorBtn.style.borderColor = '#FF0000';
            });
            colorBtn.dataset.color = color;
            paletteContainer.appendChild(colorBtn);
        });

        const grid = document.getElementById('profile-grid');
        grid.innerHTML = '';
        const startDrawing = () => { isDrawing = true; };
        const stopDrawing = () => { isDrawing = false; };
        
        grid.addEventListener('mousedown', startDrawing);
        document.addEventListener('mouseup', stopDrawing);
        grid.addEventListener('touchstart', startDrawing, {passive: false});
        document.addEventListener('touchend', stopDrawing);

        for (let i = 0; i < 196; i++) {
            const cell = document.createElement('div');
            cell.style.width = '100%';
            cell.style.height = '100%';
            cell.style.backgroundColor = tempProfileData[i];
            cell.style.userSelect = 'none';
            
            const paint = () => {
                cell.style.backgroundColor = currentProfileColor;
                tempProfileData[i] = currentProfileColor;
            };

            cell.addEventListener('mousedown', paint);
            cell.addEventListener('mouseenter', () => { if (isDrawing) paint(); });

            cell.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (!isDrawing) return;
                const touch = e.touches[0];
                const target = document.elementFromPoint(touch.clientX, touch.clientY);
                if (target && target.parentElement === grid) {
                    const index = Array.from(grid.children).indexOf(target);
                    if (index !== -1) {
                        target.style.backgroundColor = currentProfileColor;
                        tempProfileData[index] = currentProfileColor;
                    }
                }
            }, {passive: false});

            grid.appendChild(cell);
        }
    }

    btnEditProfile.addEventListener('click', () => {
        modalSettings.classList.remove('active');
        tempProfileData = [...gameData.playerProfile];
        initProfileEditor();
        modalProfileEdit.classList.add('active');
    });

    btnCloseProfile.addEventListener('click', () => {
        modalProfileEdit.classList.remove('active');
        modalSettings.classList.add('active');
    });

    btnSaveProfile.addEventListener('click', () => {
        gameData.playerProfile = [...tempProfileData];
        gameData.saveGameData();
        updateProfileUI();
        modalProfileEdit.classList.remove('active');
        showMessage('プロフィールを保存しました！');
    });

    // ========================================================================
    // 初期化 (データリセット) の3重確認ロジック
    // ========================================================================
    let resetTimerInterval;
    btnInitStart.addEventListener('click', () => {
        modalSettings.classList.remove('active');
        modalResetStep1.classList.add('active');
    });
    btnResetCancel1.addEventListener('click', () => modalResetStep1.classList.remove('active'));
    btnResetYes1.addEventListener('click', () => {
        modalResetStep1.classList.remove('active');
        modalResetStep2.classList.add('active');
        let timeLeft = 10;
        resetCountdownText.textContent = timeLeft;
        btnResetNext2.disabled = true;
        resetTimerInterval = setInterval(() => {
            timeLeft--;
            resetCountdownText.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(resetTimerInterval);
                btnResetNext2.disabled = false;
            }
        }, 1000);
    });
    btnResetNext2.addEventListener('click', () => {
        modalResetStep2.classList.remove('active');
        modalResetStep3.classList.add('active');
        resetTargetName.textContent = gameData.getPlayerName();
        resetNameInput.value = "";
    });
    btnResetCancel3.addEventListener('click', () => modalResetStep3.classList.remove('active'));
    btnResetExecute.addEventListener('click', () => {
        if (resetNameInput.value === gameData.getPlayerName()) {
            modalResetStep3.classList.remove('active');
            gameData.resetAllData();
            inputName.value = "";
            showScreen(screenNameInput);
            showMessage('データを初期化しました。');
        } else {
            showMessage('名前が一致しません。');
        }
    });

    // ========================================================================
    // ホーム画面とプレイモードのロジック
    // ========================================================================
    btnPlay.addEventListener('click', () => { audioSys.init(); showScreen(screenPlay); });
    btnClosePlay.addEventListener('click', () => showScreen(screenHome));

    btnVersusMode.addEventListener('click', () => {
        audioSys.init();
        screenMatchmaking.style.opacity = '0';
        showScreen(screenMatchmaking);
        
        setTimeout(() => { screenMatchmaking.style.opacity = '1'; }, 50);

        const waitTime = Math.floor(Math.random() * 500) + 500;
        
        setTimeout(() => {
            screenMatchmaking.style.opacity = '0';
            setTimeout(() => {
                initBattle();
                showScreen(screenBattle);
                audioSys.playBGM(); // バトル開始時にBGM再生
            }, 500); 
        }, waitTime + 500);
    });

    btnStoryMode.addEventListener('click', () => showMessage('ストーリーモードは<br>開発中です！'));

    // ========================================================================
    // 装備画面のロジック (最大4枠, 同キャラ2体まで)
    // ========================================================================
    const MAX_EQUIP = 4;
    btnEquip.addEventListener('click', () => {
        renderEquipScreen();
        showScreen(screenEquip);
    });
    btnCloseEquip.addEventListener('click', () => showScreen(screenHome));

    function renderEquipScreen(filterText = "") {
        equippedList.innerHTML = "";
        ownedList.innerHTML = "";

        const ownedCounts = {};
        gameData.ownedSlimes.forEach(id => { ownedCounts[id] = (ownedCounts[id] || 0) + 1; });

        const equipCounts = {};
        gameData.equippedSlimes.forEach(id => { equipCounts[id] = (equipCounts[id] || 0) + 1; });

        for (let i = 0; i < MAX_EQUIP; i++) {
            const slotId = gameData.equippedSlimes[i];
            if (slotId) {
                const charaInfo = characterDatabase.find(c => c.id === slotId);
                const card = createCharaCard(charaInfo, true, i);
                equippedList.appendChild(card);
            } else {
                const emptySlot = document.createElement('div');
                emptySlot.className = 'chara-slot';
                emptySlot.textContent = '空き';
                equippedList.appendChild(emptySlot);
            }
        }

        const uniqueOwnedIds = Object.keys(ownedCounts);
        const filteredSlimes = characterDatabase.filter(chara => {
            const isOwned = uniqueOwnedIds.includes(chara.id);
            const matchesSearch = chara.name.includes(filterText);
            return isOwned && matchesSearch;
        });

        filteredSlimes.forEach(chara => {
            const ownedCount = ownedCounts[chara.id];
            const equippedCount = equipCounts[chara.id] || 0;
            const card = createCharaCard(chara, false, null, ownedCount, equippedCount);
            ownedList.appendChild(card);
        });
    }

    function createCharaCard(chara, isEquippedArea, equipIndex = null, ownedCount = 1, equippedCount = 0) {
        const card = document.createElement('div');
        card.className = 'chara-card';
        
        if (chara.rarity === 'common') card.classList.add('rarity-common');
        else if (chara.rarity === 'uncommon') card.classList.add('rarity-uncommon');
        else if (chara.rarity === 'rare') card.classList.add('rarity-rare');
        else if (chara.rarity === 'legendary') card.classList.add('rarity-legendary');
        
        const img = document.createElement('img');
        img.src = chara.image;
        img.alt = chara.name;
        img.onerror = function() {
            this.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"%3E%3Crect fill="%23ddd" width="60" height="60"/%3E%3Ctext fill="%23555" x="30" y="30" font-family="sans-serif" font-size="10" text-anchor="middle" dy="3"%3ENo Image%3C/text%3E%3C/svg%3E';
        };

        const nameSpan = document.createElement('span');
        nameSpan.className = 'chara-name';
        
        if (!isEquippedArea) {
            nameSpan.textContent = `${chara.name} * ${ownedCount}`;
        } else {
            nameSpan.textContent = chara.name;
        }

        card.appendChild(img);
        card.appendChild(nameSpan);

        card.addEventListener('click', () => {
            if (isEquippedArea) {
                if (gameData.equippedSlimes.length > 1) {
                    gameData.equippedSlimes.splice(equipIndex, 1);
                    gameData.saveGameData();
                    renderEquipScreen(searchSlimeInput.value);
                } else {
                    showMessage('最低1体は装備する必要があります。');
                }
            } else {
                if (gameData.equippedSlimes.length >= MAX_EQUIP) { showMessage('装備は最大4体までです。'); return; }
                if (equippedCount >= 2) { showMessage('同じスライムは2体までしか装備できません。'); return; }
                if (equippedCount >= ownedCount) { showMessage('所持数以上に装備することはできません。'); return; }
                
                gameData.equippedSlimes.push(chara.id);
                gameData.saveGameData();
                renderEquipScreen(searchSlimeInput.value);
            }
        });

        return card;
    }

    // ========================================================================
    // バトルシステム
    // ========================================================================
    let battleState = {
        playerTeam: [],
        enemyTeam: [],
        pIndex: 0,
        eIndex: 0,
        perfectStreak: 0,
        currentWord: null,
        typedIndex: 0,
        isPerfect: true,
        isActive: false,
    };

    const rarityRanks = ['common', 'uncommon', 'rare', 'legendary'];
    
    // レアリティを数字で取得
    function getRarityNum(rarity) {
        if(rarity === 'common') return 1;
        if(rarity === 'uncommon') return 2;
        if(rarity === 'rare') return 3;
        if(rarity === 'legendary') return 4;
        return 1;
    }

    function getUpgradeProb(currentRarityRank, winStreak) {
        let base = 10 - currentRarityRank;
        if (base < 1) {
            let diff = 1 - base;
            base = 1 / Math.pow(2, diff);
        }
        return base + (winStreak * 5);
    }

    if (btnSpeedToggle) {
        btnSpeedToggle.addEventListener('click', () => {
            if (currentBattleSpeed === 1) {
                currentBattleSpeed = 3;
                btnSpeedToggle.textContent = "3倍速";
                btnSpeedToggle.classList.remove('btn-yellow');
                btnSpeedToggle.classList.add('btn-red');
            } else {
                currentBattleSpeed = 1;
                btnSpeedToggle.textContent = "1倍速";
                btnSpeedToggle.classList.remove('btn-red');
                btnSpeedToggle.classList.add('btn-yellow');
            }
            document.documentElement.style.setProperty('--battle-speed', currentBattleSpeed);
        });
    }

    function showAbilityText(dom, text = "能力発動") {
        if(!dom) return;
        let abilityEl = dom.querySelector('.ability-text');
        if (!abilityEl) {
            abilityEl = document.createElement('div');
            abilityEl.className = 'ability-text';
            dom.appendChild(abilityEl);
        }
        abilityEl.textContent = text;
        
        abilityEl.classList.remove('show');
        void abilityEl.offsetWidth; // Reflow
        abilityEl.classList.add('show');
        
        setTimeout(() => {
            abilityEl.classList.remove('show');
        }, 1000 / currentBattleSpeed);
    }

    function initBattle() {
        battlePlayerTeam.innerHTML = "";
        battleEnemyTeam.innerHTML = "";
        
        battleState.playerTeam = gameData.equippedSlimes.map(id => {
            const base = characterDatabase.find(c => c.id === id);
            return { 
                ...base, 
                currentHp: base.hp, 
                attackCount: 0, 
                poisonTurns: 0, 
                burnTurns: 0, 
                burnDamageCount: 0, 
                stunTurns: 0, 
                revived: false, 
                countered: false,
                wallCooldown: 0, // ハンマースライム用
                isPlayer: true, 
                dom: null 
            };
        });

        // ハンマースライムが編成されている場合、先頭に「壁」をスポーンさせる
        const hasHammer = battleState.playerTeam.some(c => c.id === 'slime_09');
        if (hasHammer) {
            const wall = {
                id: "wall_slime",
                name: "壁",
                rarity: "common",
                hp: 8,
                currentHp: 8,
                attack: 0,
                attackCount: 0,
                poisonTurns: 0,
                burnTurns: 0,
                stunTurns: 0,
                isPlayer: true,
                image: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect width="80" height="80" fill="%237F8C8D" rx="8"/%3E%3Ctext x="40" y="55" font-size="40" text-anchor="middle" fill="white"%3E🧱%3C/text%3E%3C/svg%3E',
                dom: null
            };
            battleState.playerTeam.unshift(wall);
        }

        battleState.enemyTeam = [];
        if (gameData.isFirstBattle) {
            const base = characterDatabase.find(c => c.id === 'slime_01');
            battleState.enemyTeam.push({ 
                ...base, currentHp: base.hp, attackCount: 0, poisonTurns: 0, burnTurns: 0, burnDamageCount: 0, stunTurns: 0, revived: false, countered: false, isPlayer: false, dom: null 
            });
            gameData.isFirstBattle = false;
            gameData.saveGameData();
        } else {
            // 敵は味方の数（壁を除く）と同じ数だけ生成
            const enemyCount = gameData.equippedSlimes.length;
            
            for (let i = 0; i < enemyCount; i++) {
                let playerChara = battleState.playerTeam.find(c => c.id !== 'wall_slime' && !c.checked);
                if(playerChara) playerChara.checked = true; // 雑に重複回避
                let currentRankIndex = playerChara ? rarityRanks.indexOf(playerChara.rarity) : 0;
                if(currentRankIndex === -1) currentRankIndex = 0;
                
                let targetRankIndex = currentRankIndex;
                let prob = getUpgradeProb(currentRankIndex, gameData.winStreak);
                
                if (Math.random() * 100 < prob && targetRankIndex < rarityRanks.length - 1) {
                    targetRankIndex++;
                }
                
                let targetRarity = rarityRanks[targetRankIndex];
                let possibleEnemies = characterDatabase.filter(c => c.rarity === targetRarity);
                
                while (possibleEnemies.length === 0 && targetRankIndex > 0) {
                    targetRankIndex--;
                    targetRarity = rarityRanks[targetRankIndex];
                    possibleEnemies = characterDatabase.filter(c => c.rarity === targetRarity);
                }
                if (possibleEnemies.length === 0) {
                    possibleEnemies = characterDatabase.filter(c => c.rarity === 'common');
                }
                
                let filteredEnemies = possibleEnemies.filter(c => !battleState.enemyTeam.some(e => e.id === c.id));
                if (filteredEnemies.length === 0) {
                    filteredEnemies = possibleEnemies;
                }
                
                const randomEnemy = filteredEnemies[Math.floor(Math.random() * filteredEnemies.length)];
                battleState.enemyTeam.push({ 
                    ...randomEnemy, 
                    currentHp: randomEnemy.hp, 
                    attackCount: 0, 
                    poisonTurns: 0, 
                    burnTurns: 0,
                    burnDamageCount: 0,
                    stunTurns: 0,
                    revived: false, 
                    countered: false,
                    isPlayer: false, 
                    dom: null 
                });
            }
        }

        battleState.enemyTeam.forEach((chara, i) => {
            chara.dom = createBattleIcon(chara, `enemy-${i}`);
            battleEnemyTeam.appendChild(chara.dom);
        });

        battleState.playerTeam.forEach((chara, i) => {
            chara.dom = createBattleIcon(chara, `player-${i}`);
            battlePlayerTeam.appendChild(chara.dom);
        });

        battleState.pIndex = 0;
        battleState.eIndex = battleState.enemyTeam.length - 1;
        battleState.perfectStreak = 0;
        battleState.isActive = true;

        updateAllBattleUI();
        startPlayerTurn();
    }

    function createBattleIcon(chara, idStr) {
        const charaIcon = document.createElement('div');
        charaIcon.className = 'battle-chara';
        charaIcon.id = idStr;
        
        const statusDiv = document.createElement('div');
        statusDiv.className = 'battle-status-effect';

        const img = document.createElement('img');
        img.src = chara.image;
        
        const statsDiv = document.createElement('div');
        statsDiv.className = 'battle-stats';
        
        charaIcon.appendChild(statusDiv);
        charaIcon.appendChild(img);
        charaIcon.appendChild(statsDiv);
        
        return charaIcon;
    }

    function updateStatusIcon(chara) {
        let icons = [];
        if (chara.stunTurns > 0) icons.push('😵‍💫');
        if (chara.burnTurns > 0) icons.push('🔥');
        if (chara.poisonTurns > 0) icons.push('☠️');
        
        const statusDiv = chara.dom.querySelector('.battle-status-effect');
        if (icons.length > 0 && chara.currentHp > 0) {
            statusDiv.innerHTML = icons.join('');
            statusDiv.style.display = 'block';
        } else {
            statusDiv.style.display = 'none';
        }
    }

    function updateAllBattleUI() {
        battleState.playerTeam.forEach(chara => {
            const dom = chara.dom;
            const stats = dom.querySelector('.battle-stats');
            if (chara.currentHp <= 0) {
                dom.classList.add('fainted');
                stats.innerHTML = '❤️0';
                if(chara.id === 'wall_slime') dom.style.display = 'none'; // 壁は壊れたら隠す
            } else {
                dom.style.display = 'flex';
                dom.classList.remove('fainted');
                const hpDisplay = Math.round(chara.currentHp * 10) / 10;
                stats.innerHTML = `❤️${hpDisplay} 🗡️${chara.attack}`;
            }
            updateStatusIcon(chara);
        });

        battleState.enemyTeam.forEach(chara => {
            const dom = chara.dom;
            const stats = dom.querySelector('.battle-stats');
            if (chara.currentHp <= 0) {
                dom.classList.add('fainted');
                stats.innerHTML = '❤️0';
            } else {
                dom.classList.remove('fainted');
                const hpDisplay = Math.round(chara.currentHp * 10) / 10;
                stats.innerHTML = `❤️${hpDisplay} 🗡️${chara.attack}`;
            }
            updateStatusIcon(chara);
        });
        
        if (battleState.perfectStreak > 0) {
            const multiplier = (1 + (0.2 * battleState.perfectStreak)).toFixed(1);
            perfectBonusDisplay.textContent = `PERFECT連続! 攻撃力 x${multiplier}`;
        } else {
            perfectBonusDisplay.textContent = "";
        }
    }

    function checkDeathCounter(deadChara, killerChara) {
        if (deadChara.currentHp <= 0 && deadChara.id === 'slime_05' && !deadChara.countered && killerChara) {
            deadChara.countered = true;
            showAbilityText(deadChara.dom, "死亡時カウンター!");
            playSlashAnimation(killerChara.dom, currentBattleSpeed);
            killerChara.currentHp -= deadChara.attack * 3;
            audioSys.playDamage();
            
            if (killerChara.currentHp <= 0 && killerChara.id === 'slime_01' && !killerChara.revived) {
                killerChara.currentHp = killerChara.hp / 2;
                killerChara.revived = true;
                showAbilityText(killerChara.dom, "能力発動");
            }
            updateAllBattleUI();
        }
    }

    function startPlayerTurn() {
        if (!battleState.isActive) return;
        
        while (battleState.pIndex < battleState.playerTeam.length && battleState.playerTeam[battleState.pIndex].currentHp <= 0) {
            battleState.pIndex++;
        }
        if (battleState.pIndex >= battleState.playerTeam.length) {
            endBattle(false);
            return;
        }
        
        while (battleState.eIndex >= 0 && battleState.enemyTeam[battleState.eIndex].currentHp <= 0) {
            battleState.eIndex--;
        }
        if (battleState.eIndex < 0) {
            endBattle(true);
            return;
        }

        let activePlayer = battleState.playerTeam[battleState.pIndex];
        let activeEnemy = battleState.enemyTeam[battleState.eIndex];

        // ハンマースライム行動時の壁再設置ロジック
        if (activePlayer.id === 'slime_09') {
            let wall = battleState.playerTeam.find(c => c.id === 'wall_slime');
            if (wall && wall.currentHp <= 0) {
                activePlayer.wallCooldown++;
                if (activePlayer.wallCooldown >= 3) {
                    wall.currentHp = wall.hp;
                    activePlayer.wallCooldown = 0;
                    showAbilityText(activePlayer.dom, "壁を再設置！");
                    updateAllBattleUI();
                }
            }
        }

        if (activePlayer.poisonTurns > 0) {
            activePlayer.currentHp -= 1;
            activePlayer.poisonTurns -= 1;
        }
        if (activePlayer.burnTurns > 0) {
            activePlayer.currentHp -= 0.8;
            activePlayer.burnTurns -= 1;
            activePlayer.burnDamageCount = (activePlayer.burnDamageCount || 0) + 1;
            if (activePlayer.burnDamageCount >= 3) {
                activePlayer.stunTurns = 1;
                activePlayer.burnDamageCount = 0;
            }
        }
        updateAllBattleUI();
        
        if (activePlayer.currentHp <= 0) {
            if (activePlayer.id === 'slime_01' && !activePlayer.revived) {
                activePlayer.currentHp = activePlayer.hp / 2;
                activePlayer.revived = true;
                showAbilityText(activePlayer.dom, "能力発動");
                updateAllBattleUI();
            } else {
                checkDeathCounter(activePlayer, activeEnemy);
                setTimeout(startPlayerTurn, 500 / currentBattleSpeed);
                return;
            }
        }

        // 壁はタイピング行動を行わず、すぐ次のキャラへスキップする
        if (activePlayer.id === 'wall_slime') {
            battleState.pIndex++;
            startPlayerTurn();
            return;
        }

        if (activePlayer.currentHp > 0 && activePlayer.stunTurns > 0) {
            activePlayer.stunTurns -= 1;
            showAbilityText(activePlayer.dom, "気絶中");
            updateAllBattleUI();
            setTimeout(startEnemyTurn, 500 / currentBattleSpeed);
            return;
        }

        battleMessage.style.display = 'none';
        typingJp.style.display = 'block';
        typeTyped.style.display = 'inline';
        typeUntyped.style.display = 'inline';
        
        battleState.currentWord = typingWords[Math.floor(Math.random() * typingWords.length)];
        battleState.typedIndex = 0;
        battleState.isPerfect = true;
        
        renderTypingText();
        document.addEventListener('keydown', handleTyping);
    }

    function renderTypingText() {
        typingJp.textContent = battleState.currentWord.jp;
        typeTyped.textContent = battleState.currentWord.en.substring(0, battleState.typedIndex);
        typeUntyped.textContent = battleState.currentWord.en.substring(battleState.typedIndex);
    }

    function handleTyping(e) {
        if (!battleState.isActive || !battleState.currentWord) return;
        
        const key = e.key.toLowerCase();
        if (key.length !== 1 || !/[a-z]/.test(key)) return;

        const targetChar = battleState.currentWord.en[battleState.typedIndex];
        
        if (key === targetChar) {
            audioSys.playTyping(); // 打鍵音
            battleState.typedIndex++;
            renderTypingText();
            
            if (battleState.typedIndex >= battleState.currentWord.en.length) {
                document.removeEventListener('keydown', handleTyping);
                
                typingJp.style.display = 'none';
                typeTyped.style.display = 'none';
                typeUntyped.style.display = 'none';
                
                if (battleState.isPerfect) {
                    battleState.perfectStreak++;
                } else {
                    battleState.perfectStreak = 0;
                }
                updateAllBattleUI();
                
                setTimeout(() => {
                    executeAttack(true);
                }, 300 / currentBattleSpeed);
            }
        } else {
            battleState.isPerfect = false;
        }
    }

    function executeAttack(isPlayerAttacking) {
        if (!battleState.isActive) return;

        let attacker = isPlayerAttacking ? battleState.playerTeam[battleState.pIndex] : battleState.enemyTeam[battleState.eIndex];
        let defender = isPlayerAttacking ? battleState.enemyTeam[battleState.eIndex] : battleState.playerTeam[battleState.pIndex];

        attacker.attackCount = (attacker.attackCount || 0) + 1;
        let finalDamage = attacker.attack;

        let isLaserAttack = false;
        if (attacker.id === 'slime_04' && attacker.attackCount % 3 === 0) {
            finalDamage = 1.5;
            defender.stunTurns = 1;
            isLaserAttack = true;
            showAbilityText(attacker.dom, "レーザー攻撃!");
        }

        if (attacker.id === 'slime_02' && attacker.attackCount % 3 === 0) {
            attacker.attack = Math.min(30, attacker.attack * 3);
            finalDamage = attacker.attack;
            showAbilityText(attacker.dom, "能力発動");
        }
        if (attacker.id === 'slime_03') {
            defender.poisonTurns = 3;
            showAbilityText(attacker.dom, "能力発動");
        }
        if (attacker.id === 'slime_06') {
            defender.burnTurns = 3;
            defender.burnDamageCount = 0;
            showAbilityText(attacker.dom, "燃焼付与!");
        }

        if (isPlayerAttacking) {
            const multiplier = 1 + (0.2 * battleState.perfectStreak);
            finalDamage = finalDamage * multiplier;
        }

        audioSys.playAttack(); // 攻撃効果音

        if (isLaserAttack) {
            playLaserAnimation(attacker.dom, defender.dom, currentBattleSpeed);
        } else {
            const animClass = isPlayerAttacking ? 'attack-move-right' : 'attack-move-left';
            attacker.dom.classList.add(animClass);
            setTimeout(() => attacker.dom.classList.remove(animClass), 200 / currentBattleSpeed);
        }

        setTimeout(() => {
            audioSys.playDamage(); // ダメージ音
            defender.dom.classList.add('damage-shake');
            setTimeout(() => defender.dom.classList.remove('damage-shake'), 300 / currentBattleSpeed);

            defender.currentHp -= finalDamage;

            if (defender.currentHp <= 0 && defender.id === 'slime_01' && !defender.revived) {
                defender.currentHp = defender.hp / 2;
                defender.revived = true;
                showAbilityText(defender.dom, "能力発動");
            }

            checkDeathCounter(defender, attacker);
            updateAllBattleUI();

            setTimeout(() => {
                if (isPlayerAttacking) {
                    startEnemyTurn();
                } else {
                    startPlayerTurn();
                }
            }, 800 / currentBattleSpeed);
        }, 200 / currentBattleSpeed);
    }

    function startEnemyTurn() {
        if (!battleState.isActive) return;

        while (battleState.eIndex >= 0 && battleState.enemyTeam[battleState.eIndex].currentHp <= 0) {
            battleState.eIndex--;
        }
        if (battleState.eIndex < 0) {
            endBattle(true);
            return;
        }

        while (battleState.pIndex < battleState.playerTeam.length && battleState.playerTeam[battleState.pIndex].currentHp <= 0) {
            battleState.pIndex++;
        }
        if (battleState.pIndex >= battleState.playerTeam.length) {
            endBattle(false);
            return;
        }

        let activeEnemy = battleState.enemyTeam[battleState.eIndex];
        let activePlayer = battleState.playerTeam[battleState.pIndex];

        if (activeEnemy.poisonTurns > 0) {
            activeEnemy.currentHp -= 1;
            activeEnemy.poisonTurns -= 1;
        }
        if (activeEnemy.burnTurns > 0) {
            activeEnemy.currentHp -= 0.8;
            activeEnemy.burnTurns -= 1;
            activeEnemy.burnDamageCount = (activeEnemy.burnDamageCount || 0) + 1;
            if (activeEnemy.burnDamageCount >= 3) {
                activeEnemy.stunTurns = 1;
                activeEnemy.burnDamageCount = 0;
            }
        }
        updateAllBattleUI();
        
        if (activeEnemy.currentHp <= 0) {
            if (activeEnemy.id === 'slime_01' && !activeEnemy.revived) {
                activeEnemy.currentHp = activeEnemy.hp / 2;
                activeEnemy.revived = true;
                showAbilityText(activeEnemy.dom, "能力発動");
                updateAllBattleUI();
            } else {
                checkDeathCounter(activeEnemy, activePlayer);
                setTimeout(startEnemyTurn, 500 / currentBattleSpeed);
                return;
            }
        }

        if (activeEnemy.currentHp > 0 && activeEnemy.stunTurns > 0) {
            activeEnemy.stunTurns -= 1;
            showAbilityText(activeEnemy.dom, "気絶中");
            updateAllBattleUI();
            setTimeout(startPlayerTurn, 500 / currentBattleSpeed);
            return;
        }

        typingJp.style.display = 'none';
        typeTyped.style.display = 'none';
        typeUntyped.style.display = 'none';
        battleMessage.style.display = 'block';
        battleMessage.textContent = "相手のターン...";

        setTimeout(() => {
            executeAttack(false);
        }, 1000 / currentBattleSpeed);
    }

    function endBattle(isWin) {
        battleState.isActive = false;
        audioSys.stopBGM();
        
        if (isWin) {
            audioSys.playWin();
            gameData.winStreak++;
            
            // --- 報酬金の計算 ---
            let enemyCount = battleState.enemyTeam.length;
            let raritySum = 0;
            battleState.enemyTeam.forEach(e => {
                raritySum += getRarityNum(e.rarity);
            });
            
            let baseMoney = enemyCount * raritySum * 100;
            
            // マネースライムの恩恵（倍率計算）
            let moneySlimesCount = battleState.playerTeam.filter(p => p.id === 'slime_08').length;
            let finalMoney = baseMoney * Math.pow(2, moneySlimesCount);
            
            gameData.money += finalMoney;
            
            rewardMoneyText.textContent = `獲得賞金: ${finalMoney}円`;
            moneyController.updateDisplay();
        } else {
            audioSys.playLose();
            gameData.winStreak = 0; 
        }
        
        gameData.saveGameData();

        setTimeout(() => {
            if (isWin) {
                showRewardScreen();
            } else {
                modalLose.classList.add('active');
            }
        }, 1000 / currentBattleSpeed);
    }

    btnCloseLose.addEventListener('click', () => {
        modalLose.classList.remove('active');
        showScreen(screenHome);
    });

    function showRewardScreen() {
        rewardGridContainer.innerHTML = "";
        
        const uniqueEnemies = [];
        const seenIds = new Set();
        battleState.enemyTeam.forEach(enemy => {
            if (!seenIds.has(enemy.id)) {
                seenIds.add(enemy.id);
                uniqueEnemies.push(enemy);
            }
        });

        uniqueEnemies.forEach(enemy => {
            const card = document.createElement('div');
            card.className = 'chara-card';
            if (enemy.rarity === 'common') card.classList.add('rarity-common');
            else if (enemy.rarity === 'uncommon') card.classList.add('rarity-uncommon');
            else if (enemy.rarity === 'rare') card.classList.add('rarity-rare');
            else if (enemy.rarity === 'legendary') card.classList.add('rarity-legendary');

            const img = document.createElement('img');
            img.src = enemy.image;
            const nameSpan = document.createElement('span');
            nameSpan.className = 'chara-name';
            nameSpan.textContent = enemy.name;

            card.appendChild(img);
            card.appendChild(nameSpan);

            card.addEventListener('click', () => {
                gameData.ownedSlimes.push(enemy.id);
                gameData.saveGameData();
                modalReward.classList.remove('active');
                showMessage(`${enemy.name}をゲットした！<br>現在の連勝数: ${gameData.winStreak}`);
                showScreen(screenHome);
            });

            rewardGridContainer.appendChild(card);
        });

        modalReward.classList.add('active');
    }

    initGame();
});
