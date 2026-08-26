// ============================================================================
// コンソールの無効化
// ============================================================================
(function() {
    const noop = function() {};
    const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'group', 'groupEnd', 'time', 'timeEnd', 'assert', 'profile', 'dir', 'dirxml'];
    if (typeof window !== 'undefined') {
        if (!window.console) {
            window.console = {};
        }
        for (let i = 0; i < methods.length; i++) {
            try {
                window.console[methods[i]] = noop;
            } catch (e) {}
        }
    }
})();

// ============================================================================
// 【メモ】レアリティシステム仕様
// ----------------------------------------------------------------------------
// レアリティは以下の4種類のみ存在します。
// コモンから順に強くなっていきます (コモン < アンコモン < レア < レジェンド)。
//
// 1. コモン (グレー / 灰色)     - レアリティ数値: 1
// 2. アンコモン (緑 / 緑色)     - レアリティ数値: 2
// 3. レア (青 / 青色)           - レアリティ数値: 3 (※ライフスライムはここに配置)
// 4. レジェンド (黄色 / 黄金)   - レアリティ数値: 4
//
// 【メモ】勝利時のお金獲得計算式
// 試合が終わって勝ったら:
// 獲得金額(円) = (自分のスライムの数) * (相手のスライムのレアリティを数字で表した時の合計) * 100
//
// 【メモ】レベルアップシステム仕様
// ・初期レベル: 1 (最大レベル: 50)
// ・レベルアップ費用: 現在のレベル * 1000 円 (例: Lv1->2は1000円, Lv2->3は2000円, ..., Lv49->50は49000円)
// ・ステータス上昇: レベル1上がるごとにHP・攻撃力が+5%上昇 (基本値 * (1 + (Lv - 1) * 0.05))
// ・敵チームのレベル配分: 味方スライムのレベル合計 / 味方スライムの数 で均等に配分
// ============================================================================

// レアリティの数値変換関数
function getRarityNumber(rarityStr) {
    switch (rarityStr) {
        case 'common': return 1;
        case 'uncommon': return 2;
        case 'rare': return 3;
        case 'legend': return 4;
        default: return 1;
    }
}

// レアリティの日本語表記変換
function getRarityJapanese(rarityStr) {
    switch (rarityStr) {
        case 'common': return 'コモン';
        case 'uncommon': return 'アンコモン';
        case 'rare': return 'レア';
        case 'legend': return 'レジェンド';
        default: return 'コモン';
    }
}

// ============================================================================
// システム管理クラス群
// ============================================================================

class GameDataManager {
    constructor() {
        this.loadData();
    }

    loadData() {
        this.playerName = localStorage.getItem('playerName') || null;
        
        // 所持金 (初期値: 0円)
        const savedMoney = localStorage.getItem('playerMoney');
        this.money = savedMoney !== null ? parseInt(savedMoney, 10) : 0;
        if (isNaN(this.money)) this.money = 0;

        // 初期状態の読み込み。なければスライム(ID:slime_01)1体のみ所持・装備
        const savedOwned = localStorage.getItem('ownedSlimes');
        this.ownedSlimes = savedOwned ? JSON.parse(savedOwned) : ["slime_01"];
        
        const savedEquipped = localStorage.getItem('equippedSlimes');
        this.equippedSlimes = savedEquipped ? JSON.parse(savedEquipped) : ["slime_01"]; 
        
        // 各スライムのレベル情報 (ID -> レベル)
        const savedLevels = localStorage.getItem('slimeLevels');
        this.slimeLevels = savedLevels ? JSON.parse(savedLevels) : {};

        const savedFirstBattle = localStorage.getItem('isFirstBattle');
        this.isFirstBattle = savedFirstBattle === null ? true : (savedFirstBattle === 'true');

        // 連勝記録の読み込み
        const savedStreak = localStorage.getItem('winStreak');
        this.winStreak = savedStreak ? parseInt(savedStreak, 10) : 0;

        // プロフィールの読み込み (14x14=196配列)
        const savedProfile = localStorage.getItem('playerProfile');
        this.playerProfile = savedProfile ? JSON.parse(savedProfile) : Array(196).fill('transparent');
    }

    getSlimeLevel(slimeId) {
        if (!this.slimeLevels || typeof this.slimeLevels[slimeId] !== 'number') {
            return 1;
        }
        return Math.max(1, Math.min(50, this.slimeLevels[slimeId]));
    }

    levelUpSlime(slimeId) {
        const currentLv = this.getSlimeLevel(slimeId);
        if (currentLv >= 50) {
            return { success: false, message: '既に最大レベル(50)に達しています。' };
        }
        const cost = currentLv * 1000;
        if (this.money < cost) {
            return { 
                success: false, 
                message: `所持金が足りません。<br>必要: <strong>${cost.toLocaleString()}円</strong><br>所持金: <strong>${this.money.toLocaleString()}円</strong>` 
            };
        }
        this.money -= cost;
        this.slimeLevels[slimeId] = currentLv + 1;
        this.saveGameData();
        return { success: true, newLevel: currentLv + 1, cost };
    }

    savePlayerName(name) {
        this.playerName = name;
        localStorage.setItem('playerName', name);
    }

    addMoney(amount) {
        this.money = Math.max(0, this.money + amount);
        this.saveGameData();
    }

    saveGameData() {
        localStorage.setItem('playerMoney', this.money.toString());
        localStorage.setItem('ownedSlimes', JSON.stringify(this.ownedSlimes));
        localStorage.setItem('equippedSlimes', JSON.stringify(this.equippedSlimes));
        localStorage.setItem('slimeLevels', JSON.stringify(this.slimeLevels));
        localStorage.setItem('isFirstBattle', this.isFirstBattle);
        localStorage.setItem('winStreak', this.winStreak.toString());
        localStorage.setItem('playerProfile', JSON.stringify(this.playerProfile));
    }

    getPlayerName() {
        return this.playerName;
    }

    resetAllData() {
        localStorage.clear();
        this.loadData();
    }
}

class MoneyDisplayController {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
    }
    updateDisplay(amount) {
        if (this.element) {
            const current = typeof amount === 'number' ? amount : (window.gameData ? window.gameData.money : 0);
            this.element.textContent = `所持金 ${current.toLocaleString()}円`;
        }
    }
}

// ============================================================================
// グローバル変数
// ============================================================================
let currentBattleSpeed = 1;
const gameData = new GameDataManager();
window.gameData = gameData;
const moneyController = new MoneyDisplayController('money-display');

document.addEventListener('DOMContentLoaded', () => {
    // ---- 画面要素 ----
    const screenNameInput = document.getElementById('screen-name-input');
    const screenHome = document.getElementById('screen-home');
    const screenPlay = document.getElementById('screen-play');
    const screenEquip = document.getElementById('screen-equip');
    const screenMatchmaking = document.getElementById('screen-matchmaking');
    const screenBattle = document.getElementById('screen-battle');
    
    // ---- UI要素 ----
    const inputName = document.getElementById('player-name-input');
    const btnDecideName = document.getElementById('btn-decide-name');
    const displayPlayerName = document.getElementById('display-player-name');
    
    const btnSettings = document.getElementById('btn-settings');
    const btnPlay = document.getElementById('btn-play');
    const btnShop = document.getElementById('btn-shop');
    const btnEquip = document.getElementById('btn-equip');
    const btnCloseEquip = document.getElementById('btn-close-equip');

    // プレイモード画面
    const btnClosePlay = document.getElementById('btn-close-play');
    const btnVersusMode = document.getElementById('btn-versus-mode');
    const btnStoryMode = document.getElementById('btn-story-mode');

    // 装備画面
    const searchSlimeInput = document.getElementById('search-slime');
    const equippedList = document.getElementById('equipped-list');
    const ownedList = document.getElementById('owned-list');
    const btnModeEquip = document.getElementById('btn-mode-equip');
    const btnModeDetail = document.getElementById('btn-mode-detail');
    const equipHintText = document.getElementById('equip-hint-text');
    const ownedHintText = document.getElementById('owned-hint-text');
    let currentEquipMode = 'equip'; // 'equip' | 'detail'

    // バトル画面
    const battlePlayerTeam = document.getElementById('battle-player-team');
    const battleEnemyTeam = document.getElementById('battle-enemy-team');
    const typingJp = document.getElementById('typing-jp');
    const typeTyped = document.getElementById('type-typed');
    const typeUntyped = document.getElementById('type-untyped');
    const perfectBonusDisplay = document.getElementById('perfect-bonus-display');
    const battleMessage = document.getElementById('battle-message');
    const btnSpeedToggle = document.getElementById('btn-speed-toggle');

    // モーダル関連
    const modalSettings = document.getElementById('modal-settings');
    const settingsNameInput = document.getElementById('settings-name-input');
    const btnUpdateName = document.getElementById('btn-update-name');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const btnSettingsRules = document.getElementById('btn-settings-rules');

    const modalRules = document.getElementById('modal-rules');
    const btnOpenRules = document.getElementById('btn-open-rules');
    const btnCloseRules = document.getElementById('btn-close-rules');

    const modalCharaDetail = document.getElementById('modal-chara-detail');
    const detailName = document.getElementById('detail-name');
    const detailRarity = document.getElementById('detail-rarity');
    const detailLevel = document.getElementById('detail-level');
    const detailImage = document.getElementById('detail-image');
    const detailHp = document.getElementById('detail-hp');
    const detailAttack = document.getElementById('detail-attack');
    const detailAbility = document.getElementById('detail-ability');
    const levelupCostText = document.getElementById('levelup-cost-text');
    const btnLevelupSlime = document.getElementById('btn-levelup-slime');
    const btnCloseDetail = document.getElementById('btn-close-detail');
    let currentDetailChara = null;

    const modalMessage = document.getElementById('modal-message');
    const messageText = document.getElementById('message-text');
    const btnCloseMessage = document.getElementById('btn-close-message');

    // 初期化モーダル関連
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

    // バトル終了モーダル
    const modalReward = document.getElementById('modal-reward');
    const rewardGridContainer = document.getElementById('reward-grid-container');
    const rewardMoneyBanner = document.getElementById('reward-money-banner');
    const rewardMoneyDetail = document.getElementById('reward-money-detail');
    const modalLose = document.getElementById('modal-lose');
    const btnCloseLose = document.getElementById('btn-close-lose');

    // プロフィールモーダル関連
    const btnEditProfile = document.getElementById('btn-edit-profile');
    const modalProfileEdit = document.getElementById('modal-profile-edit');
    const btnCloseProfile = document.getElementById('btn-close-profile');
    const btnSaveProfile = document.getElementById('btn-save-profile');

    // ========================================================================
    // 基本画面遷移・共通UI制御
    // ========================================================================

    function showScreen(screenElement) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screenElement.classList.add('active');
    }

    function showMessage(text) {
        messageText.innerHTML = text;
        modalMessage.classList.add('active');
    }

    if (btnCloseMessage) {
        btnCloseMessage.addEventListener('click', () => {
            modalMessage.classList.remove('active');
        });
    }

    function initGame() {
        moneyController.updateDisplay(gameData.money);
        
        if (gameData.getPlayerName()) {
            updateProfileUI();
            showScreen(screenHome);
        } else {
            showScreen(screenNameInput);
        }
    }

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
        const trimmedName = nameString.trim();
        if (trimmedName.length >= 3 && trimmedName.length <= 12) {
            gameData.savePlayerName(trimmedName);
            updateProfileUI();
            
            if (isInitialRegistration) {
                showScreen(screenHome);
            }
            return true;
        } else {
            showMessage('名前は3文字以上、<br>12文字以下で入力してください。');
            return false;
        }
    }

    btnDecideName.addEventListener('click', () => {
        validateAndSaveName(inputName.value, true);
    });

    btnSettings.addEventListener('click', () => {
        settingsNameInput.value = gameData.getPlayerName() || "";
        modalSettings.classList.add('active');
    });

    btnCloseSettings.addEventListener('click', () => {
        modalSettings.classList.remove('active');
    });

    if (btnOpenRules) {
        btnOpenRules.addEventListener('click', () => {
            modalRules.classList.add('active');
        });
    }

    if (btnSettingsRules) {
        btnSettingsRules.addEventListener('click', () => {
            modalSettings.classList.remove('active');
            modalRules.classList.add('active');
        });
    }

    if (btnCloseRules) {
        btnCloseRules.addEventListener('click', () => {
            modalRules.classList.remove('active');
        });
    }

    btnUpdateName.addEventListener('click', () => {
        const success = validateAndSaveName(settingsNameInput.value, false);
        if (success) {
            modalSettings.classList.remove('active');
            showMessage('名前を変更しました！');
        }
    });

    // --- プロフィールデモ機能とエディタ ---
    let currentProfileColor = '#000000';
    let tempProfileData = Array(196).fill('transparent');
    let isDrawing = false;

    const colorCodeMap = {
        '.': 'transparent', 'B': '#3498DB', 'R': '#E74C3C', 'G': '#2ECC71',
        'Y': '#F1C40F', 'K': '#000000', 'W': '#FFFFFF', 'M': '#9B59B6',
        'O': '#E67E22', 'C': '#87CEEB', 'S': '#BDC3C7'
    };

    const demoProfiles = [
        {
            name: "スライム",
            pattern: [
                "..............",
                "..............",
                "..............",
                "..............",
                ".....BBBB.....",
                "...BBBBBBBB...",
                "..BBB.BB.BBB..",
                ".BBBB.BB.BBBB.",
                ".BBBBBBBBBBBB.",
                ".BBBBBBBBBBBB.",
                ".BBBBBBBBBBBB.",
                "..BBBBBBBBBB..",
                "..............",
                ".............."
            ]
        },
        {
            name: "ハート",
            pattern: [
                "..............",
                "..............",
                "..RRR....RRR..",
                ".RRRRR..RRRRR.",
                ".RRRRRRRRRRRR.",
                ".RRRRRRRRRRRR.",
                "..RRRRRRRRRR..",
                "...RRRRRRRR...",
                "....RRRRRR....",
                ".....RRRR.....",
                "......RR......",
                "..............",
                "..............",
                ".............."
            ]
        },
        {
            name: "剣",
            pattern: [
                ".............S",
                "............SS",
                "...........SS.",
                "..........SS..",
                ".........SS...",
                "........SS....",
                ".......SS.....",
                "......SS......",
                ".....SS.......",
                "..KKSS........",
                ".KKKK.........",
                "K.KK..........",
                "..............",
                ".............."
            ]
        },
        {
            name: "星",
            pattern: [
                "..............",
                "......YY......",
                "......YY......",
                ".....YYYY.....",
                "..YYYYYYYYYY..",
                "...YYYYYYYY...",
                "....YYYYYY....",
                "....YYYYYY....",
                "...YYY..YYY...",
                "..YYY....YYY..",
                "..YY......YY..",
                "..............",
                "..............",
                ".............."
            ]
        },
        {
            name: "ポーション",
            pattern: [
                "..............",
                ".....KKKK.....",
                ".....KWWK.....",
                ".....KWWK.....",
                "....KMMMMK....",
                "...KMMMMMMK...",
                "..KMMMMMMMMK..",
                "..KMMMMMMMMK..",
                "..KMMMMMMMMK..",
                "..KMMMMMMMMK..",
                "...KMMMMMMK...",
                "....KKKKKK....",
                "..............",
                ".............."
            ]
        }
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
        if (!grid) return;
        Array.from(grid.children).forEach((cell, index) => {
            cell.style.backgroundColor = tempProfileData[index];
        });
    }

    function initProfileEditor() {
        const demoContainer = document.getElementById('demo-profiles-container');
        if (demoContainer) {
            demoContainer.innerHTML = '';
            demoProfiles.forEach((demo) => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-blue btn-small';
                btn.textContent = demo.name;
                btn.addEventListener('click', () => {
                    tempProfileData = parseDemoPattern(demo.pattern);
                    updateGridDisplay();
                });
                demoContainer.appendChild(btn);
            });
        }

        const paletteColors = ['#000000', '#FFFFFF', '#E74C3C', '#3498DB', '#2ECC71', '#F1C40F', '#9B59B6', '#E67E22', '#87CEEB', 'transparent'];
        const paletteContainer = document.getElementById('color-palette');
        if (paletteContainer) {
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
        }

        const grid = document.getElementById('profile-grid');
        if (grid) {
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
                cell.addEventListener('mouseenter', () => {
                    if (isDrawing) paint();
                });

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

    btnResetCancel1.addEventListener('click', () => {
        modalResetStep1.classList.remove('active');
    });

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

    btnResetCancel3.addEventListener('click', () => {
        modalResetStep3.classList.remove('active');
    });

    btnResetExecute.addEventListener('click', () => {
        if (resetNameInput.value === gameData.getPlayerName()) {
            modalResetStep3.classList.remove('active');
            gameData.resetAllData();
            inputName.value = "";
            moneyController.updateDisplay(0);
            showScreen(screenNameInput);
            showMessage('データを初期化しました。');
        } else {
            showMessage('名前が一致しません。');
        }
    });

    // ========================================================================
    // ホーム画面とプレイモードのロジック
    // ========================================================================

    btnPlay.addEventListener('click', () => {
        showScreen(screenPlay);
    });

    btnClosePlay.addEventListener('click', () => {
        showScreen(screenHome);
    });

    btnVersusMode.addEventListener('click', () => {
        screenMatchmaking.style.opacity = '0';
        showScreen(screenMatchmaking);
        
        setTimeout(() => {
            screenMatchmaking.style.opacity = '1';
        }, 50);

        const waitTime = Math.floor(Math.random() * 500) + 500;
        
        setTimeout(() => {
            screenMatchmaking.style.opacity = '0';
            setTimeout(() => {
                initBattle();
                showScreen(screenBattle);
            }, 500); 
        }, waitTime + 500);
    });

    btnStoryMode.addEventListener('click', () => {
        showMessage('ストーリーモードは<br>開発中です！');
    });

    btnShop.addEventListener('click', () => {
        showMessage(`ショップは準備中です！<br>現在の所持金: <strong>${gameData.money.toLocaleString()}円</strong>`);
    });

    // ========================================================================
    // 装備画面のロジック (最大4枠, 同キャラ2体まで)
    // ========================================================================

    const MAX_EQUIP = 4;

    btnEquip.addEventListener('click', () => {
        setEquipMode('equip'); // デフォルトは装備モード
        renderEquipScreen();
        showScreen(screenEquip);
    });

    btnCloseEquip.addEventListener('click', () => {
        showScreen(screenHome);
    });

    function setEquipMode(mode) {
        currentEquipMode = mode;
        if (btnModeEquip && btnModeDetail) {
            if (mode === 'equip') {
                btnModeEquip.classList.add('active-equip');
                btnModeDetail.classList.remove('active-detail');
                if (screenEquip) screenEquip.classList.remove('detail-mode-active');
                if (equipHintText) equipHintText.textContent = 'タップして外す';
                if (ownedHintText) ownedHintText.textContent = 'タップして装備 (同キャラ最大2体)';
            } else {
                btnModeEquip.classList.remove('active-equip');
                btnModeDetail.classList.add('active-detail');
                if (screenEquip) screenEquip.classList.add('detail-mode-active');
                if (equipHintText) equipHintText.textContent = 'タップして詳細・レベルアップ';
                if (ownedHintText) ownedHintText.textContent = 'タップして詳細・レベルアップ';
            }
        }
        renderEquipScreen(searchSlimeInput ? searchSlimeInput.value : "");
    }

    if (btnModeEquip) {
        btnModeEquip.addEventListener('click', () => setEquipMode('equip'));
    }

    if (btnModeDetail) {
        btnModeDetail.addEventListener('click', () => setEquipMode('detail'));
    }

    if (searchSlimeInput) {
        searchSlimeInput.addEventListener('input', (e) => {
            renderEquipScreen(e.target.value);
        });
    }

    function renderEquipScreen(filterText = "") {
        equippedList.innerHTML = "";
        ownedList.innerHTML = "";

        const ownedCounts = {};
        gameData.ownedSlimes.forEach(id => {
            ownedCounts[id] = (ownedCounts[id] || 0) + 1;
        });

        const equipCounts = {};
        gameData.equippedSlimes.forEach(id => {
            equipCounts[id] = (equipCounts[id] || 0) + 1;
        });

        for (let i = 0; i < MAX_EQUIP; i++) {
            const slotId = gameData.equippedSlimes[i];
            if (slotId) {
                const charaInfo = characterDatabase.find(c => c.id === slotId);
                if (charaInfo) {
                    const card = createCharaCard(charaInfo, true, i);
                    equippedList.appendChild(card);
                }
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
            const matchesSearch = chara.name.toLowerCase().includes(filterText.toLowerCase());
            return isOwned && matchesSearch;
        });

        filteredSlimes.forEach(chara => {
            const ownedCount = ownedCounts[chara.id];
            const equippedCount = equipCounts[chara.id] || 0;
            const card = createCharaCard(chara, false, null, ownedCount, equippedCount);
            ownedList.appendChild(card);
        });
    }

    // キャラクターカード生成 (4段階レアリティに対応)
    function createCharaCard(chara, isEquippedArea, equipIndex = null, ownedCount = 1, equippedCount = 0) {
        const card = document.createElement('div');
        card.className = 'chara-card';
        
        // 4種類のレアリティクラス付与
        if (chara.rarity === 'common') card.classList.add('rarity-common');
        else if (chara.rarity === 'uncommon') card.classList.add('rarity-uncommon');
        else if (chara.rarity === 'rare') card.classList.add('rarity-rare');
        else if (chara.rarity === 'legend') card.classList.add('rarity-legend');
        
        // レアリティバッジ
        const badge = document.createElement('span');
        badge.className = 'rarity-badge';
        badge.textContent = getRarityJapanese(chara.rarity);
        card.appendChild(badge);

        // レベルバッジ
        const slimeLevel = gameData.getSlimeLevel(chara.id);
        const levelBadge = document.createElement('span');
        levelBadge.className = 'level-badge';
        levelBadge.textContent = `Lv.${slimeLevel}`;
        levelBadge.title = "タップして強化・詳細";
        levelBadge.addEventListener('click', (e) => {
            e.stopPropagation();
            showCharaDetail(chara);
        });
        card.appendChild(levelBadge);

        const img = document.createElement('img');
        img.src = chara.image;
        img.alt = chara.name;
        img.onerror = function() {
            this.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"%3E%3Crect fill="%23ddd" width="60" height="60"/%3E%3Ctext fill="%23555" x="30" y="30" font-family="sans-serif" font-size="10" text-anchor="middle" dy="3"%3ENo Image%3C/text%3E%3C/svg%3E';
        };

        const nameSpan = document.createElement('span');
        nameSpan.className = 'chara-name';
        
        if (!isEquippedArea) {
            nameSpan.textContent = `${chara.name} ×${ownedCount}`;
        } else {
            nameSpan.textContent = chara.name;
        }

        card.appendChild(img);
        card.appendChild(nameSpan);

        // 詳細モード中なら「🔍詳細/LVUP」ヒントをカード内に表示
        if (currentEquipMode === 'detail') {
            const detailHint = document.createElement('span');
            detailHint.style.position = 'absolute';
            detailHint.style.bottom = '26px';
            detailHint.style.left = '50%';
            detailHint.style.transform = 'translateX(-50%)';
            detailHint.style.fontSize = '9px';
            detailHint.style.background = '#F1C40F';
            detailHint.style.color = '#000';
            detailHint.style.padding = '1px 5px';
            detailHint.style.borderRadius = '3px';
            detailHint.style.border = '1px solid #000';
            detailHint.style.fontWeight = 'bold';
            detailHint.style.whiteSpace = 'nowrap';
            detailHint.textContent = '🔍詳細/LVUP';
            card.appendChild(detailHint);
        }

        // 詳細表示用（長押しまたは右クリック）
        card.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showCharaDetail(chara);
        });

        // モバイル等の長押し対応
        let pressTimer = null;
        card.addEventListener('touchstart', (e) => {
            pressTimer = setTimeout(() => {
                showCharaDetail(chara);
            }, 500);
        }, { passive: true });
        card.addEventListener('touchend', () => {
            if (pressTimer) clearTimeout(pressTimer);
        });
        card.addEventListener('touchmove', () => {
            if (pressTimer) clearTimeout(pressTimer);
        });

        // タップによる処理 (モードによって分岐)
        card.addEventListener('click', () => {
            if (currentEquipMode === 'detail') {
                // 詳細 / LVUP モード時はタップで詳細・育成画面を表示
                showCharaDetail(chara);
            } else {
                // 装備モード時はタップで装備 / 外す
                if (isEquippedArea) {
                    if (gameData.equippedSlimes.length > 1) {
                        gameData.equippedSlimes.splice(equipIndex, 1);
                        gameData.saveGameData();
                        renderEquipScreen(searchSlimeInput ? searchSlimeInput.value : "");
                    } else {
                        showMessage('最低1体は装備する必要があります。');
                    }
                } else {
                    if (gameData.equippedSlimes.length >= MAX_EQUIP) {
                        showMessage('装備は最大4体までです。');
                        return;
                    }
                    if (equippedCount >= 2) {
                        showMessage('同じスライムは2体までしか装備できません。');
                        return;
                    }
                    if (equippedCount >= ownedCount) {
                        showMessage('所持数以上に装備することはできません。');
                        return;
                    }
                    
                    gameData.equippedSlimes.push(chara.id);
                    gameData.saveGameData();
                    renderEquipScreen(searchSlimeInput ? searchSlimeInput.value : "");
                }
            }
        });

        return card;
    }

    function showCharaDetail(chara) {
        if (!modalCharaDetail) return;
        currentDetailChara = chara;

        const level = gameData.getSlimeLevel(chara.id);
        const stats = typeof getSlimeStats === 'function' ? getSlimeStats(chara, level) : { hp: chara.hp, attack: chara.attack, level };

        detailName.textContent = chara.name;
        detailRarity.textContent = `【レアリティ】${getRarityJapanese(chara.rarity)} (★${getRarityNumber(chara.rarity)})`;
        if (detailLevel) {
            detailLevel.textContent = `Lv. ${level} / 50`;
        }
        detailImage.src = chara.image;
        detailHp.innerHTML = `${stats.hp} <span style="font-size: 13px; color: #7F8C8D;">(Lv.1基本: ${chara.hp})</span>`;
        detailAttack.innerHTML = `${stats.attack} <span style="font-size: 13px; color: #7F8C8D;">(Lv.1基本: ${chara.attack})</span>`;
        detailAbility.textContent = chara.ability;

        if (levelupCostText && btnLevelupSlime) {
            if (level >= 50) {
                levelupCostText.innerHTML = `⭐ <strong>レベル最大 (Lv.50)</strong>`;
                btnLevelupSlime.textContent = `レベルMAX`;
                btnLevelupSlime.disabled = true;
                btnLevelupSlime.classList.remove('btn-yellow');
                btnLevelupSlime.classList.add('btn-gray');
            } else {
                const cost = level * 1000;
                const nextStats = typeof getSlimeStats === 'function' ? getSlimeStats(chara, level + 1) : stats;
                levelupCostText.innerHTML = `次Lv費用: <strong>${cost.toLocaleString()}円</strong> <span style="font-size:12px; color:#555;">(所持金: ${gameData.money.toLocaleString()}円)</span><br><span style="font-size:12px; color:#27AE60;">次Lv時: ❤️${nextStats.hp} ⚔️${nextStats.attack}</span>`;
                btnLevelupSlime.textContent = `レベルアップ (${cost.toLocaleString()}円 / +5%UP)`;
                btnLevelupSlime.disabled = false;
                btnLevelupSlime.classList.remove('btn-gray');
                btnLevelupSlime.classList.add('btn-yellow');
            }
        }

        modalCharaDetail.classList.add('active');
    }

    if (btnLevelupSlime) {
        btnLevelupSlime.addEventListener('click', () => {
            if (!currentDetailChara) return;
            const result = gameData.levelUpSlime(currentDetailChara.id);
            if (result.success) {
                moneyController.updateDisplay();
                showCharaDetail(currentDetailChara);
                renderEquipScreen(searchSlimeInput ? searchSlimeInput.value : "");
            } else {
                showMessage(result.message);
            }
        });
    }

    if (btnCloseDetail) {
        btnCloseDetail.addEventListener('click', () => {
            modalCharaDetail.classList.remove('active');
        });
    }

    // ========================================================================
    // バトルシステム (4段階レアリティ & 各種能力)
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
        isActive: false
    };

    // 4種類のレアリティ順序 (コモンから順に強くなる)
    const rarityRanks = ['common', 'uncommon', 'rare', 'legend'];

    // プレイヤーの所持スライムに基づく最大解放レアリティの判定
    function getMaxUnlockedRank() {
        if (!gameData.ownedSlimes) return 0;
        
        let commonCount = 0;
        let uncommonCount = 0;
        let rareCount = 0;

        gameData.ownedSlimes.forEach(id => {
            const c = characterDatabase.find(item => item.id === id);
            if (!c) return;
            if (c.rarity === 'common') commonCount++;
            else if (c.rarity === 'uncommon') uncommonCount++;
            else if (c.rarity === 'rare') rareCount++;
        });

        let maxRank = 0; // 0: commonのみ
        if (commonCount >= 3) maxRank = 1; // 3体以上でアンコモン解放
        if (uncommonCount >= 3) maxRank = 2; // 3体以上でレア解放
        if (rareCount >= 3) maxRank = 3; // 3体以上でレジェンド解放

        return maxRank;
    }

    // 次のレアリティへの昇格確率 (上位レアリティほど低確率)
    function getUpgradeProb(targetNextRank, winStreak) {
        // targetNextRank: 1(uncommon), 2(rare), 3(legend)
        let baseProb = 25;
        if (targetNextRank === 1) baseProb = 28; // アンコモン: 28%
        else if (targetNextRank === 2) baseProb = 16; // レア: 16%
        else if (targetNextRank === 3) baseProb = 7; // レジェンド: 7%

        return Math.min(60, baseProb + (winStreak * 2));
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

    function initBattle() {
        battlePlayerTeam.innerHTML = "";
        battleEnemyTeam.innerHTML = "";
        
        battleState.playerTeam = gameData.equippedSlimes.map(id => {
            const base = characterDatabase.find(c => c.id === id) || characterDatabase[0];
            const level = gameData.getSlimeLevel(base.id);
            const stats = typeof getSlimeStats === 'function' ? getSlimeStats(base, level) : { hp: base.hp, attack: base.attack, level };
            return { 
                ...base, 
                level: level,
                hp: stats.hp,
                attack: stats.attack,
                currentHp: stats.hp, 
                attackCount: 0, 
                poisonTurns: 0, 
                burnTurns: 0, 
                burnDamageCount: 0, 
                stunTurns: 0, 
                revived: false, 
                countered: false,
                wallHp: 0,
                wallCooldown: 0,
                hasSummonedWall: false,
                barrierTurns: 0,
                barrierReduction: 0,
                fighterTurnCount: 0,
                isFighterCharged: false,
                hasBoostedTeamHp: false,
                isPlayer: true, 
                dom: null 
            };
        });

        // 敵のレベル計算: 味方のスライムのレベル合計 / 味方のスライムの数
        const totalPlayerLevel = battleState.playerTeam.reduce((sum, c) => sum + (c.level || 1), 0);
        const avgPlayerLevel = Math.max(1, Math.min(50, Math.round(totalPlayerLevel / battleState.playerTeam.length)));

        // 解放されている最大レアリティ
        const maxUnlockedRank = getMaxUnlockedRank();

        battleState.enemyTeam = [];
        if (gameData.isFirstBattle) {
            const base = characterDatabase.find(c => c.id === 'slime_01') || characterDatabase[0];
            const enemyLevel = avgPlayerLevel;
            const stats = typeof getSlimeStats === 'function' ? getSlimeStats(base, enemyLevel) : { hp: base.hp, attack: base.attack, level: enemyLevel };
            battleState.enemyTeam.push({ 
                ...base, 
                level: enemyLevel,
                hp: stats.hp,
                attack: stats.attack,
                currentHp: stats.hp, 
                attackCount: 0, 
                poisonTurns: 0, 
                burnTurns: 0, 
                burnDamageCount: 0, 
                stunTurns: 0, 
                revived: false, 
                countered: false, 
                wallHp: 0,
                wallCooldown: 0,
                hasSummonedWall: false,
                barrierTurns: 0,
                barrierReduction: 0,
                fighterTurnCount: 0,
                isFighterCharged: false,
                hasBoostedTeamHp: false,
                isPlayer: false, 
                dom: null 
            });
            gameData.isFirstBattle = false;
            gameData.saveGameData();
        } else {
            const enemyCount = battleState.playerTeam.length;
            
            for (let i = 0; i < enemyCount; i++) {
                let playerChara = battleState.playerTeam[i];
                let currentRankIndex = rarityRanks.indexOf(playerChara.rarity);
                if (currentRankIndex === -1) currentRankIndex = 0;
                
                // 解放されているレアリティの上限までに制限
                currentRankIndex = Math.min(currentRankIndex, maxUnlockedRank);

                let targetRankIndex = currentRankIndex;
                
                // 次のレアリティが解放されていれば、低確率で出現判定
                if (targetRankIndex < maxUnlockedRank) {
                    const nextRank = targetRankIndex + 1;
                    const prob = getUpgradeProb(nextRank, gameData.winStreak);
                    if (Math.random() * 100 < prob) {
                        targetRankIndex = nextRank;
                    }
                }
                
                let targetRarity = rarityRanks[targetRankIndex] || 'common';
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
                const enemyLevel = avgPlayerLevel;
                const stats = typeof getSlimeStats === 'function' ? getSlimeStats(randomEnemy, enemyLevel) : { hp: randomEnemy.hp, attack: randomEnemy.attack, level: enemyLevel };

                battleState.enemyTeam.push({ 
                    ...randomEnemy, 
                    level: enemyLevel,
                    hp: stats.hp,
                    attack: stats.attack,
                    currentHp: stats.hp, 
                    attackCount: 0, 
                    poisonTurns: 0, 
                    burnTurns: 0,
                    burnDamageCount: 0,
                    stunTurns: 0, 
                    revived: false, 
                    countered: false,
                    wallHp: 0,
                    wallCooldown: 0,
                    hasSummonedWall: false,
                    barrierTurns: 0,
                    barrierReduction: 0,
                    fighterTurnCount: 0,
                    isFighterCharged: false,
                    hasBoostedTeamHp: false,
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

        // ケアスライム (slime_13) の開幕能力: 生存味方全員の最大HP+15%UP
        applyCareSlimeOpeningBuff(battleState.playerTeam);
        applyCareSlimeOpeningBuff(battleState.enemyTeam);

        updateAllBattleUI();
        startPlayerTurn();
    }

    // ケアスライムの開幕全体最大HP+15%UP処理
    function applyCareSlimeOpeningBuff(team) {
        const careSlime = team.find(c => c.id === 'slime_13' && c.currentHp > 0);
        if (careSlime && !careSlime.hasBoostedTeamHp) {
            careSlime.hasBoostedTeamHp = true;
            team.forEach(member => {
                if (member.currentHp > 0) {
                    const originalHp = member.hp;
                    const newHp = Math.round(originalHp * 1.15 * 10) / 10;
                    const addedHp = Math.round((newHp - originalHp) * 10) / 10;
                    member.hp = newHp;
                    member.currentHp = Math.round((member.currentHp + addedHp) * 10) / 10;
                    if (typeof playHealAnimation === 'function' && member.dom) {
                        playHealAnimation(member.dom, `💚+15%HP`, currentBattleSpeed);
                    }
                }
            });
            if (careSlime.dom) {
                showAbilityText(careSlime.dom, "✨全員最大HP+15%UP!", currentBattleSpeed);
            }
        }
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
        if (chara.wallHp > 0) icons.push(`🧱${Math.round(chara.wallHp * 10) / 10}`);
        if (chara.barrierTurns > 0) icons.push(`🛡️${chara.barrierTurns}T`);
        if (chara.isFighterCharged) icons.push('🔥溜め');
        if (chara.stunTurns > 0) icons.push('😵‍💫');
        if (chara.burnTurns > 0) icons.push('🔥');
        if (chara.poisonTurns > 0) icons.push('☠️');
        
        const statusDiv = chara.dom.querySelector('.battle-status-effect');
        if (icons.length > 0 && chara.currentHp > 0) {
            statusDiv.innerHTML = icons.join(' ');
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
                stats.innerHTML = `<span style="font-size:10px; display:block; color:#7F8C8D;">Lv.${chara.level || 1}</span>❤️0`;
            } else {
                dom.classList.remove('fainted');
                const hpDisplay = Math.round(chara.currentHp * 10) / 10;
                stats.innerHTML = `<span style="font-size:10px; display:block; color:#2C3E50; font-weight:bold;">Lv.${chara.level || 1}</span>❤️${hpDisplay} 🗡️${chara.attack}`;
            }
            updateStatusIcon(chara);
        });

        battleState.enemyTeam.forEach(chara => {
            const dom = chara.dom;
            const stats = dom.querySelector('.battle-stats');
            if (chara.currentHp <= 0) {
                dom.classList.add('fainted');
                stats.innerHTML = `<span style="font-size:10px; display:block; color:#7F8C8D;">Lv.${chara.level || 1}</span>❤️0`;
            } else {
                dom.classList.remove('fainted');
                const hpDisplay = Math.round(chara.currentHp * 10) / 10;
                stats.innerHTML = `<span style="font-size:10px; display:block; color:#C0392B; font-weight:bold;">Lv.${chara.level || 1}</span>❤️${hpDisplay} 🗡️${chara.attack}`;
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

    // 死亡時能力チェック（スライムソードカウンター & ケアスライムバリア付与）
    function checkDeathEffects(deadChara, killerChara) {
        if (deadChara.currentHp <= 0) {
            // スライムソード (slime_05) のカウンター
            if (deadChara.id === 'slime_05' && !deadChara.countered && killerChara) {
                deadChara.countered = true;
                showAbilityText(deadChara.dom, "死亡時カウンター!", currentBattleSpeed);
                if (typeof playSlashAnimation === 'function') {
                    playSlashAnimation(killerChara.dom, currentBattleSpeed);
                }
                killerChara.currentHp -= deadChara.attack * 3;
                
                if (killerChara.currentHp <= 0 && killerChara.id === 'slime_01' && !killerChara.revived) {
                    killerChara.currentHp = killerChara.hp / 2;
                    killerChara.revived = true;
                    showAbilityText(killerChara.dom, "復活!", currentBattleSpeed);
                }
            }

            // ケアスライム (slime_13) の死亡時バリア付与能力 (次の味方1体に2ターン25%軽減バリア)
            if (deadChara.id === 'slime_13' && !deadChara.countered) {
                deadChara.countered = true;
                const team = deadChara.isPlayer ? battleState.playerTeam : battleState.enemyTeam;
                // 次に控えている生存スライムを探す
                let targetMember = team.find(m => m !== deadChara && m.currentHp > 0);
                if (targetMember) {
                    targetMember.barrierTurns = 2;
                    targetMember.barrierReduction = 0.25;
                    showAbilityText(targetMember.dom, "🛡️25%バリア(2T)付与!", currentBattleSpeed);
                    if (typeof playBarrierAnimation === 'function') {
                        playBarrierAnimation(targetMember.dom, "🛡️25%バリア!", currentBattleSpeed);
                    }
                }
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

        // ライフスライム (slime_07) の自動回復能力 (HPが減っていれば毎ターン1回復)
        if (activePlayer.id === 'slime_07' && activePlayer.currentHp > 0 && activePlayer.currentHp < activePlayer.hp) {
            activePlayer.currentHp = Math.min(activePlayer.hp, activePlayer.currentHp + 1);
            showAbilityText(activePlayer.dom, "ライフ回復+1", currentBattleSpeed);
            if (typeof playHealAnimation === 'function') {
                playHealAnimation(activePlayer.dom, '💚+1', currentBattleSpeed);
            }
        }

        // ハンマースライム (slime_12) の壁復活チェック (クールダウンカウントダウン)
        if (activePlayer.id === 'slime_12' && activePlayer.wallHp <= 0 && activePlayer.wallCooldown > 0) {
            activePlayer.wallCooldown--;
            if (activePlayer.wallCooldown === 0) {
                activePlayer.wallHp = 8;
                showAbilityText(activePlayer.dom, "🧱壁が復活(HP8)!", currentBattleSpeed);
                if (typeof playWallAnimation === 'function') {
                    playWallAnimation(activePlayer.dom, "🧱壁復活!", currentBattleSpeed);
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
                showAbilityText(activePlayer.dom, "能力発動", currentBattleSpeed);
                updateAllBattleUI();
            } else {
                checkDeathEffects(activePlayer, activeEnemy);
                setTimeout(startPlayerTurn, 500 / currentBattleSpeed);
                return;
            }
        }

        if (activePlayer.currentHp > 0 && activePlayer.stunTurns > 0) {
            activePlayer.stunTurns -= 1;
            showAbilityText(activePlayer.dom, "気絶中", currentBattleSpeed);
            updateAllBattleUI();
            setTimeout(startEnemyTurn, 500 / currentBattleSpeed);
            return;
        }

        // ハンマースライム (slime_12) の初ターン壁設置 (壁設置時は攻撃不可)
        if (activePlayer.id === 'slime_12' && !activePlayer.hasSummonedWall) {
            activePlayer.hasSummonedWall = true;
            activePlayer.wallHp = 8;
            showAbilityText(activePlayer.dom, "🧱HP8の壁を生成!", currentBattleSpeed);
            if (typeof playWallAnimation === 'function') {
                playWallAnimation(activePlayer.dom, "🧱HP8の壁!", currentBattleSpeed);
            }
            updateAllBattleUI();
            setTimeout(startEnemyTurn, 800 / currentBattleSpeed);
            return;
        }

        // ファイタースライム (slime_14) の4ターン毎力溜め (行動不可、次攻撃力3倍)
        if (activePlayer.id === 'slime_14') {
            activePlayer.fighterTurnCount = (activePlayer.fighterTurnCount || 0) + 1;
            if (activePlayer.fighterTurnCount % 4 === 0) {
                activePlayer.isFighterCharged = true;
                showAbilityText(activePlayer.dom, "🔥力を溜めている...", currentBattleSpeed);
                updateAllBattleUI();
                setTimeout(startEnemyTurn, 800 / currentBattleSpeed);
                return;
            }
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
        if (key.length !== 1 || !/[a-z\-]/.test(key)) return;

        const targetChar = battleState.currentWord.en[battleState.typedIndex];
        
        if (key === targetChar) {
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
        // マゼンタスライム (slime_04)
        if (attacker.id === 'slime_04' && attacker.attackCount % 3 === 0) {
            finalDamage = 1.8;
            defender.stunTurns = 1;
            isLaserAttack = true;
            showAbilityText(attacker.dom, "レーザー攻撃!", currentBattleSpeed);
        }

        // イエロースライム (slime_02)
        if (attacker.id === 'slime_02' && attacker.attackCount % 3 === 0) {
            attacker.attack = Math.min(30, attacker.attack * 3);
            finalDamage = attacker.attack;
            showAbilityText(attacker.dom, "攻撃力3倍!", currentBattleSpeed);
        }

        // ファイタースライム (slime_14) 溜め攻撃発動 (攻撃力3倍)
        if (attacker.id === 'slime_14' && attacker.isFighterCharged) {
            finalDamage = attacker.attack * 3;
            attacker.isFighterCharged = false;
            showAbilityText(attacker.dom, "💥渾身の3倍撃!!", currentBattleSpeed);
        }

        // グリーンスライム (slime_03)
        if (attacker.id === 'slime_03') {
            defender.poisonTurns = 3;
            showAbilityText(attacker.dom, "毒付与!", currentBattleSpeed);
        }

        // オレンジスライム (slime_06)
        if (attacker.id === 'slime_06') {
            defender.burnTurns = 3;
            defender.burnDamageCount = 0;
            showAbilityText(attacker.dom, "燃焼付与!", currentBattleSpeed);
        }

        // 水晶スライム (slime_10) クリティカル確率
        if (attacker.id === 'slime_10' && Math.random() < 0.25) {
            finalDamage *= 1.5;
            showAbilityText(attacker.dom, "クリティカル!", currentBattleSpeed);
        }

        if (isPlayerAttacking) {
            const multiplier = 1 + (0.2 * battleState.perfectStreak);
            finalDamage = finalDamage * multiplier;
        }

        // --- 防御側のダメージ軽減判定 ---
        // 1. ファイタースライム (slime_14) の底力 (HP8割以下で受けるダメージ50%カット)
        if (defender.id === 'slime_14' && defender.currentHp <= (defender.hp * 0.8)) {
            finalDamage *= 0.5;
            showAbilityText(defender.dom, "🥋闘志ガード-50%", currentBattleSpeed);
        }

        // 2. ケアスライムのバリア (25%ダメージカット)
        if (defender.barrierTurns > 0) {
            finalDamage *= (1 - (defender.barrierReduction || 0.25));
            showAbilityText(defender.dom, "🛡️バリア-25%", currentBattleSpeed);
        }

        // 3. スライムシールド (slime_08) の防御軽減 (常に0.5軽減)
        if (defender.id === 'slime_08') {
            finalDamage = Math.max(0.2, finalDamage - 0.5);
            showAbilityText(defender.dom, "シールドガード!", currentBattleSpeed);
        }

        // --- ハンマースライム (slime_12) の壁身代わり判定 ---
        if (defender.wallHp > 0) {
            if (defender.wallHp >= finalDamage) {
                defender.wallHp -= finalDamage;
                finalDamage = 0;
                showAbilityText(defender.dom, `🧱壁が防御! (残HP:${Math.round(defender.wallHp * 10) / 10})`, currentBattleSpeed);
                if (typeof playWallAnimation === 'function') {
                    playWallAnimation(defender.dom, "🧱ガード!", currentBattleSpeed);
                }
            } else {
                finalDamage -= defender.wallHp;
                defender.wallHp = 0;
                defender.wallCooldown = 3;
                showAbilityText(defender.dom, "💥壁が破壊された! (3T後復活)", currentBattleSpeed);
                if (typeof playWallAnimation === 'function') {
                    playWallAnimation(defender.dom, "💥壁破壊!", currentBattleSpeed);
                }
            }
        }

        if (isLaserAttack && typeof playLaserAnimation === 'function') {
            playLaserAnimation(attacker.dom, defender.dom, currentBattleSpeed);
        } else {
            const animClass = isPlayerAttacking ? 'attack-move-right' : 'attack-move-left';
            attacker.dom.classList.add(animClass);
            setTimeout(() => attacker.dom.classList.remove(animClass), 200 / currentBattleSpeed);
        }

        setTimeout(() => {
            defender.dom.classList.add('damage-shake');
            setTimeout(() => defender.dom.classList.remove('damage-shake'), 300 / currentBattleSpeed);

            defender.currentHp -= finalDamage;

            // バリア持続ターン減少
            if (defender.barrierTurns > 0) {
                defender.barrierTurns--;
            }

            if (defender.currentHp <= 0 && defender.id === 'slime_01' && !defender.revived) {
                defender.currentHp = defender.hp / 2;
                defender.revived = true;
                showAbilityText(defender.dom, "復活!", currentBattleSpeed);
            }

            checkDeathEffects(defender, attacker);

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

        // ライフスライム回復 (敵側)
        if (activeEnemy.id === 'slime_07' && activeEnemy.currentHp > 0 && activeEnemy.currentHp < activeEnemy.hp) {
            activeEnemy.currentHp = Math.min(activeEnemy.hp, activeEnemy.currentHp + 1);
            showAbilityText(activeEnemy.dom, "ライフ回復+1", currentBattleSpeed);
            if (typeof playHealAnimation === 'function') {
                playHealAnimation(activeEnemy.dom, '💚+1', currentBattleSpeed);
            }
        }

        // ハンマースライム (slime_12) の壁復活チェック (敵側)
        if (activeEnemy.id === 'slime_12' && activeEnemy.wallHp <= 0 && activeEnemy.wallCooldown > 0) {
            activeEnemy.wallCooldown--;
            if (activeEnemy.wallCooldown === 0) {
                activeEnemy.wallHp = 8;
                showAbilityText(activeEnemy.dom, "🧱壁が復活(HP8)!", currentBattleSpeed);
                if (typeof playWallAnimation === 'function') {
                    playWallAnimation(activeEnemy.dom, "🧱壁復活!", currentBattleSpeed);
                }
            }
        }

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
                showAbilityText(activeEnemy.dom, "復活!", currentBattleSpeed);
                updateAllBattleUI();
            } else {
                checkDeathEffects(activeEnemy, activePlayer);
                setTimeout(startEnemyTurn, 500 / currentBattleSpeed);
                return;
            }
        }

        if (activeEnemy.currentHp > 0 && activeEnemy.stunTurns > 0) {
            activeEnemy.stunTurns -= 1;
            showAbilityText(activeEnemy.dom, "気絶中", currentBattleSpeed);
            updateAllBattleUI();
            setTimeout(startPlayerTurn, 500 / currentBattleSpeed);
            return;
        }

        // ハンマースライム (slime_12) 初ターン壁設置 (敵側、攻撃スキップ)
        if (activeEnemy.id === 'slime_12' && !activeEnemy.hasSummonedWall) {
            activeEnemy.hasSummonedWall = true;
            activeEnemy.wallHp = 8;
            showAbilityText(activeEnemy.dom, "🧱HP8の壁を生成!", currentBattleSpeed);
            if (typeof playWallAnimation === 'function') {
                playWallAnimation(activeEnemy.dom, "🧱HP8の壁!", currentBattleSpeed);
            }
            updateAllBattleUI();
            setTimeout(startPlayerTurn, 800 / currentBattleSpeed);
            return;
        }

        // ファイタースライム (slime_14) 4ターン毎力溜め (敵側、攻撃スキップ)
        if (activeEnemy.id === 'slime_14') {
            activeEnemy.fighterTurnCount = (activeEnemy.fighterTurnCount || 0) + 1;
            if (activeEnemy.fighterTurnCount % 4 === 0) {
                activeEnemy.isFighterCharged = true;
                showAbilityText(activeEnemy.dom, "🔥力を溜めている...", currentBattleSpeed);
                updateAllBattleUI();
                setTimeout(startPlayerTurn, 800 / currentBattleSpeed);
                return;
            }
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

    // ========================================================================
    // バトル終了処理とお金計算
    // ========================================================================
    function endBattle(isWin) {
        battleState.isActive = false;
        
        let earnedMoney = 0;
        let slimeCount = 0;
        let enemyRaritySum = 0;

        if (isWin) {
            gameData.winStreak++;

            // 【メモ】所持金獲得の計算式:
            // 獲得金額 = (スライムの数) * (相手のスライムのレアリティを数字で表した時の合計) * 100
            slimeCount = battleState.playerTeam.length;
            enemyRaritySum = battleState.enemyTeam.reduce((sum, enemy) => {
                return sum + getRarityNumber(enemy.rarity);
            }, 0);

            earnedMoney = slimeCount * enemyRaritySum * 100;
            gameData.addMoney(earnedMoney);
            moneyController.updateDisplay(gameData.money);
        } else {
            gameData.winStreak = 0; 
        }
        gameData.saveGameData();

        setTimeout(() => {
            if (isWin) {
                showRewardScreen(earnedMoney, slimeCount, enemyRaritySum);
            } else {
                modalLose.classList.add('active');
            }
        }, 1000 / currentBattleSpeed);
    }

    btnCloseLose.addEventListener('click', () => {
        modalLose.classList.remove('active');
        showScreen(screenHome);
    });

    // ========================================================================
    // 勝利報酬画面ロジック (獲得金額とお金反映)
    // ========================================================================
    function showRewardScreen(earnedMoney, slimeCount, enemyRaritySum) {
        rewardGridContainer.innerHTML = "";
        
        if (rewardMoneyBanner) {
            rewardMoneyBanner.innerHTML = `💰 獲得賞金: <strong>+${earnedMoney.toLocaleString()}円</strong>`;
        }
        if (rewardMoneyDetail) {
            rewardMoneyDetail.innerHTML = `（計算式: 味方スライム数 ${slimeCount}体 × 相手レアリティ合計 ${enemyRaritySum} × 100）`;
        }

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
            
            // 4種類のレアリティクラス付与
            if (enemy.rarity === 'common') card.classList.add('rarity-common');
            else if (enemy.rarity === 'uncommon') card.classList.add('rarity-uncommon');
            else if (enemy.rarity === 'rare') card.classList.add('rarity-rare');
            else if (enemy.rarity === 'legend') card.classList.add('rarity-legend');

            const badge = document.createElement('span');
            badge.className = 'rarity-badge';
            badge.textContent = getRarityJapanese(enemy.rarity);
            card.appendChild(badge);

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
                showMessage(`<strong>${enemy.name}</strong> と <strong>${earnedMoney.toLocaleString()}円</strong> をゲット！<br>現在の所持金: <strong>${gameData.money.toLocaleString()}円</strong><br>連勝数: <strong>${gameData.winStreak}</strong>`);
                showScreen(screenHome);
            });

            rewardGridContainer.appendChild(card);
        });

        modalReward.classList.add('active');
    }

    // ========================================================================
    // ゲーム起動
    // ========================================================================
    initGame();
});
