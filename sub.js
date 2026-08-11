// ============================================================================
// システム管理クラス群 (メモリ維持対象)
// ============================================================================

class GameDataManager {
    constructor() {
        this.loadData();
    }

    loadData() {
        this.playerName = localStorage.getItem('playerName') || null;
        
        // 初期状態の読み込み。なければスライム(ID:01)1体のみ所持・装備
        const savedOwned = localStorage.getItem('ownedSlimes');
        this.ownedSlimes = savedOwned ? JSON.parse(savedOwned) : ["slime_01"];
        
        const savedEquipped = localStorage.getItem('equippedSlimes');
        this.equippedSlimes = savedEquipped ? JSON.parse(savedEquipped) : ["slime_01"]; 
        
        const savedFirstBattle = localStorage.getItem('isFirstBattle');
        this.isFirstBattle = savedFirstBattle === null ? true : (savedFirstBattle === 'true');
    }

    savePlayerName(name) {
        this.playerName = name;
        localStorage.setItem('playerName', name);
    }

    saveGameData() {
        localStorage.setItem('ownedSlimes', JSON.stringify(this.ownedSlimes));
        localStorage.setItem('equippedSlimes', JSON.stringify(this.equippedSlimes));
        localStorage.setItem('isFirstBattle', this.isFirstBattle);
    }

    getPlayerName() {
        return this.playerName;
    }

    resetAllData() {
        localStorage.clear();
        this.loadData(); // 初期状態（スライム1体）に戻す
    }
}

class BrainrotCollectionService {
    constructor() {
        this.collectionData = [];
    }
    logCollection(item) {
        console.log(`[BrainrotCollectionService] Collected: ${item}`);
    }
}

class BrainrotCarryService {
    constructor() {
        this.carryStatus = false;
    }
    updateCarryStatus(status) {
        this.carryStatus = status;
        console.log(`[BrainrotCarryService] Status updated to: ${status}`);
    }
}

class MoneyDisplayController {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.currentMoney = 0;
    }
    updateDisplay() {
        if (this.element) {
            this.element.textContent = `所持金 ${this.currentMoney}円`;
        }
    }
}

// ============================================================================
// メモ: スライムの画像の取得ですが、「（スライムの名前）.png」という感じです。
// ============================================================================
// キャラクターデータ (イエロースライムへ修正)
// ============================================================================

const characterDatabase = [
    {
        id: "slime_01",
        name: "スライム",
        rarity: "common",
        hp: 10,
        attack: 1,
        ability: "一回だけ死んでもHPを半分にして復活する",
        image: "gazou/スライム.png"
    },
    {
        id: "slime_02",
        name: "イエロースライム",
        rarity: "common",
        hp: 7,
        attack: 1,
        ability: "3回目の攻撃は攻撃力3倍（最大30までアップ可能）",
        image: "gazou/イエロースライム.png"
    },
    {
        id: "slime_03",
        name: "グリーンスライム",
        rarity: "uncommon",
        hp: 10,
        attack: 1,
        ability: "相手を3ターン毒状態にする（毒状態になると毎ターン1ダメージ喰らいます。）",
        image: "gazou/グリーンスライム.png"
    }
];

// ============================================================================
// タイピング用辞書データ (ローマ字入力完全一致用)
// ============================================================================
const typingWords = [
    { jp: "すらいむ", en: "suraimu" },
    { jp: "こうげき", en: "kougeki" },
    { jp: "ばとる", en: "batoru" },
    { jp: "たいぴんぐ", en: "taipingu" },
    { jp: "まほう", en: "mahou" },
    { jp: "けん", en: "ken" }
];

// ============================================================================
// メインゲームロジック・UI制御
// ============================================================================

const gameData = new GameDataManager();
const collectionService = new BrainrotCollectionService();
const carryService = new BrainrotCarryService();
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

    // バトル画面
    const battlePlayerTeam = document.getElementById('battle-player-team');
    const battleEnemyTeam = document.getElementById('battle-enemy-team');
    const typingJp = document.getElementById('typing-jp');
    const typeTyped = document.getElementById('type-typed');
    const typeUntyped = document.getElementById('type-untyped');
    const perfectBonusDisplay = document.getElementById('perfect-bonus-display');
    const battleMessage = document.getElementById('battle-message');

    // モーダル関連
    const modalSettings = document.getElementById('modal-settings');
    const settingsNameInput = document.getElementById('settings-name-input');
    const btnUpdateName = document.getElementById('btn-update-name');
    const btnCloseSettings = document.getElementById('btn-close-settings');

    const modalCharaDetail = document.getElementById('modal-chara-detail');
    const btnCloseDetail = document.getElementById('btn-close-detail');

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
    const modalLose = document.getElementById('modal-lose');
    const btnCloseLose = document.getElementById('btn-close-lose');

    // ========================================================================
    // 基本関数
    // ========================================================================

    function showScreen(screenElement) {
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
            displayPlayerName.textContent = gameData.getPlayerName();
            showScreen(screenHome);
        } else {
            showScreen(screenNameInput);
        }
    }

    // ========================================================================
    // 名前入力・設定ロジック
    // ========================================================================

    function validateAndSaveName(nameString, isInitialRegistration) {
        const trimmedName = nameString.trim();
        if (trimmedName.length >= 3 && trimmedName.length <= 12) {
            gameData.savePlayerName(trimmedName);
            displayPlayerName.textContent = trimmedName;
            
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

    btnUpdateName.addEventListener('click', () => {
        const success = validateAndSaveName(settingsNameInput.value, false);
        if (success) {
            modalSettings.classList.remove('active');
            showMessage('名前を変更しました！');
        }
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
        showMessage('ショップは<br>準備中です！');
    });

    // ========================================================================
    // 装備画面のロジック (最大4枠, 同キャラ2体まで)
    // ========================================================================

    const MAX_EQUIP = 4;

    btnEquip.addEventListener('click', () => {
        renderEquipScreen();
        showScreen(screenEquip);
    });

    btnCloseEquip.addEventListener('click', () => {
        showScreen(screenHome);
    });

    function renderEquipScreen(filterText = "") {
        equippedList.innerHTML = "";
        ownedList.innerHTML = "";

        // 所持数のカウントマップを作成
        const ownedCounts = {};
        gameData.ownedSlimes.forEach(id => {
            ownedCounts[id] = (ownedCounts[id] || 0) + 1;
        });

        // 装備数のカウントマップを作成
        const equipCounts = {};
        gameData.equippedSlimes.forEach(id => {
            equipCounts[id] = (equipCounts[id] || 0) + 1;
        });

        // 装備スロットの描画
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

        // ユニークな所持IDを取得して描画（検索フィルター対応）
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
        
        if (chara.rarity === 'common') {
            card.classList.add('rarity-common');
        } else if (chara.rarity === 'uncommon') {
            card.classList.add('rarity-uncommon');
        }
        
        const img = document.createElement('img');
        img.src = chara.image;
        img.alt = chara.name;
        img.onerror = function() {
            this.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"%3E%3Crect fill="%23ddd" width="60" height="60"/%3E%3Ctext fill="%23555" x="30" y="30" font-family="sans-serif" font-size="10" text-anchor="middle" dy="3"%3ENo Image%3C/text%3E%3C/svg%3E';
        };

        const nameSpan = document.createElement('span');
        nameSpan.className = 'chara-name';
        
        // 所持リストの場合は「スライム * 2」のような表示にする
        if (!isEquippedArea) {
            nameSpan.textContent = `${chara.name} * ${ownedCount}`;
        } else {
            nameSpan.textContent = chara.name;
        }

        card.appendChild(img);
        card.appendChild(nameSpan);

        // クリックイベント（着脱ロジック）
        card.addEventListener('click', () => {
            if (isEquippedArea) {
                // 装備から外す処理（最低1体は残す）
                if (gameData.equippedSlimes.length > 1) {
                    gameData.equippedSlimes.splice(equipIndex, 1);
                    gameData.saveGameData();
                    renderEquipScreen(searchSlimeInput.value);
                } else {
                    showMessage('最低1体は装備する必要があります。');
                }
            } else {
                // 装備につける処理
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
        isActive: false
    };

    function initBattle() {
        battlePlayerTeam.innerHTML = "";
        battleEnemyTeam.innerHTML = "";
        
        // 味方チーム構築 (クローン作成)
        battleState.playerTeam = gameData.equippedSlimes.map(id => {
            const base = characterDatabase.find(c => c.id === id);
            return { ...base, currentHp: base.hp, attackCount: 0, poisonTurns: 0, revived: false, isPlayer: true, dom: null };
        });

        // 敵チーム構築
        battleState.enemyTeam = [];
        if (gameData.isFirstBattle) {
            // 初回バトルはスライム1体固定
            const base = characterDatabase.find(c => c.id === 'slime_01');
            battleState.enemyTeam.push({ ...base, currentHp: base.hp, attackCount: 0, poisonTurns: 0, revived: false, isPlayer: false, dom: null });
            gameData.isFirstBattle = false;
            gameData.saveGameData();
        } else {
            // 通常の敵生成
            let maxRarityNum = 1; 
            battleState.playerTeam.forEach(chara => {
                if (chara.rarity === 'uncommon') maxRarityNum = 2;
            });
            const enemyCount = battleState.playerTeam.length;
            
            for (let i = 0; i < enemyCount; i++) {
                let targetRarityNum = maxRarityNum;
                if (Math.random() < 0.33) targetRarityNum += 1;
                let targetRarity = targetRarityNum === 1 ? 'common' : 'uncommon';
                
                let possibleEnemies = characterDatabase.filter(c => c.rarity === targetRarity);
                if (possibleEnemies.length === 0) {
                    possibleEnemies = characterDatabase.filter(c => c.rarity === (maxRarityNum === 1 ? 'common' : 'uncommon'));
                }
                const randomEnemy = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];
                battleState.enemyTeam.push({ ...randomEnemy, currentHp: randomEnemy.hp, attackCount: 0, poisonTurns: 0, revived: false, isPlayer: false, dom: null });
            }
        }

        // DOM構築
        battleState.enemyTeam.forEach((chara, i) => {
            chara.dom = createBattleIcon(chara, `enemy-${i}`);
            battleEnemyTeam.appendChild(chara.dom);
        });

        battleState.playerTeam.forEach((chara, i) => {
            chara.dom = createBattleIcon(chara, `player-${i}`);
            battlePlayerTeam.appendChild(chara.dom);
        });

        battleState.pIndex = 0;
        battleState.eIndex = 0;
        battleState.perfectStreak = 0;
        battleState.isActive = true;

        updateAllBattleUI();
        startPlayerTurn();
    }

    function createBattleIcon(chara, idStr) {
        const charaIcon = document.createElement('div');
        charaIcon.className = 'battle-chara';
        charaIcon.id = idStr;
        
        // ステータス異常のアイコン用
        const statusDiv = document.createElement('div');
        statusDiv.className = 'battle-status-effect';
        statusDiv.innerHTML = '☠️';

        const img = document.createElement('img');
        img.src = chara.image;
        
        // 下部のステータス表示
        const statsDiv = document.createElement('div');
        statsDiv.className = 'battle-stats';
        
        charaIcon.appendChild(statusDiv);
        charaIcon.appendChild(img);
        charaIcon.appendChild(statsDiv);
        
        return charaIcon;
    }

    function updateAllBattleUI() {
        // Player
        battleState.playerTeam.forEach((chara, i) => {
            const dom = chara.dom;
            const stats = dom.querySelector('.battle-stats');
            const statusIcon = dom.querySelector('.battle-status-effect');
            if (chara.currentHp <= 0) {
                dom.classList.add('fainted');
                stats.innerHTML = '❤️0';
            } else {
                dom.classList.remove('fainted');
                // currentHpは小数点第1位まで表示可能にしておく
                const hpDisplay = Math.round(chara.currentHp * 10) / 10;
                stats.innerHTML = `❤️${hpDisplay} 🗡️${chara.attack}`;
            }
            statusIcon.style.display = (chara.poisonTurns > 0 && chara.currentHp > 0) ? 'block' : 'none';
        });

        // Enemy
        battleState.enemyTeam.forEach((chara, i) => {
            const dom = chara.dom;
            const stats = dom.querySelector('.battle-stats');
            const statusIcon = dom.querySelector('.battle-status-effect');
            if (chara.currentHp <= 0) {
                dom.classList.add('fainted');
                stats.innerHTML = '❤️0';
            } else {
                dom.classList.remove('fainted');
                const hpDisplay = Math.round(chara.currentHp * 10) / 10;
                stats.innerHTML = `❤️${hpDisplay} 🗡️${chara.attack}`;
            }
            statusIcon.style.display = (chara.poisonTurns > 0 && chara.currentHp > 0) ? 'block' : 'none';
        });
        
        // ボーナス表示更新
        if (battleState.perfectStreak > 0) {
            const multiplier = (1 + (0.2 * battleState.perfectStreak)).toFixed(1);
            perfectBonusDisplay.textContent = `PERFECT連続! 攻撃力 x${multiplier}`;
        } else {
            perfectBonusDisplay.textContent = "";
        }
    }

    // --- ターン制御 ---
    function startPlayerTurn() {
        if (!battleState.isActive) return;
        
        // 味方全滅チェック
        while (battleState.pIndex < battleState.playerTeam.length && battleState.playerTeam[battleState.pIndex].currentHp <= 0) {
            battleState.pIndex++;
        }
        if (battleState.pIndex >= battleState.playerTeam.length) {
            endBattle(false);
            return;
        }
        
        // 敵全滅チェック
        while (battleState.eIndex < battleState.enemyTeam.length && battleState.enemyTeam[battleState.eIndex].currentHp <= 0) {
            battleState.eIndex++;
        }
        if (battleState.eIndex >= battleState.enemyTeam.length) {
            endBattle(true);
            return;
        }

        // 毒ダメージ処理 (ターンの開始時に受けるとする)
        let activePlayer = battleState.playerTeam[battleState.pIndex];
        if (activePlayer.poisonTurns > 0) {
            activePlayer.currentHp -= 1;
            activePlayer.poisonTurns -= 1;
            updateAllBattleUI();
            
            // 毒で死んだ場合の処理
            if (activePlayer.currentHp <= 0) {
                if (activePlayer.id === 'slime_01' && !activePlayer.revived) {
                    activePlayer.currentHp = activePlayer.hp / 2;
                    activePlayer.revived = true;
                    updateAllBattleUI();
                } else {
                    setTimeout(startPlayerTurn, 500);
                    return;
                }
            }
        }

        // タイピング設定
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
        // Shift等の修飾キーは無視
        if (key.length !== 1 || !/[a-z]/.test(key)) return;

        const targetChar = battleState.currentWord.en[battleState.typedIndex];
        
        if (key === targetChar) {
            battleState.typedIndex++;
            renderTypingText();
            
            // 打ち終わった場合
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
                
                // 少し待ってから攻撃
                setTimeout(() => {
                    executeAttack(true);
                }, 300);
            }
        } else {
            // ミス
            battleState.isPerfect = false;
        }
    }

    function executeAttack(isPlayerAttacking) {
        if (!battleState.isActive) return;

        let attacker = isPlayerAttacking ? battleState.playerTeam[battleState.pIndex] : battleState.enemyTeam[battleState.eIndex];
        let defender = isPlayerAttacking ? battleState.enemyTeam[battleState.eIndex] : battleState.playerTeam[battleState.pIndex];

        // 能力発動（攻撃側）
        attacker.attackCount = (attacker.attackCount || 0) + 1;
        if (attacker.id === 'slime_02' && attacker.attackCount % 3 === 0) {
            attacker.attack = Math.min(30, attacker.attack * 3);
        }
        if (attacker.id === 'slime_03') {
            defender.poisonTurns = 3;
        }

        // ダメージ計算
        let finalDamage = attacker.attack;
        if (isPlayerAttacking) {
            const multiplier = 1 + (0.2 * battleState.perfectStreak);
            finalDamage = finalDamage * multiplier;
        }

        // アニメーション実行
        const animClass = isPlayerAttacking ? 'attack-move-right' : 'attack-move-left';
        attacker.dom.classList.add(animClass);

        setTimeout(() => {
            attacker.dom.classList.remove(animClass);
            defender.dom.classList.add('damage-shake');
            setTimeout(() => defender.dom.classList.remove('damage-shake'), 300);

            defender.currentHp -= finalDamage;

            // 復活能力（防御側）
            if (defender.currentHp <= 0 && defender.id === 'slime_01' && !defender.revived) {
                defender.currentHp = defender.hp / 2;
                defender.revived = true;
            }

            updateAllBattleUI();

            setTimeout(() => {
                if (isPlayerAttacking) {
                    startEnemyTurn();
                } else {
                    startPlayerTurn();
                }
            }, 800);
        }, 200);
    }

    function startEnemyTurn() {
        if (!battleState.isActive) return;

        // 敵全滅チェック
        while (battleState.eIndex < battleState.enemyTeam.length && battleState.enemyTeam[battleState.eIndex].currentHp <= 0) {
            battleState.eIndex++;
        }
        if (battleState.eIndex >= battleState.enemyTeam.length) {
            endBattle(true);
            return;
        }

        // プレイヤー全滅チェック
        while (battleState.pIndex < battleState.playerTeam.length && battleState.playerTeam[battleState.pIndex].currentHp <= 0) {
            battleState.pIndex++;
        }
        if (battleState.pIndex >= battleState.playerTeam.length) {
            endBattle(false);
            return;
        }

        // 毒処理（敵）
        let activeEnemy = battleState.enemyTeam[battleState.eIndex];
        if (activeEnemy.poisonTurns > 0) {
            activeEnemy.currentHp -= 1;
            activeEnemy.poisonTurns -= 1;
            updateAllBattleUI();
            
            if (activeEnemy.currentHp <= 0) {
                if (activeEnemy.id === 'slime_01' && !activeEnemy.revived) {
                    activeEnemy.currentHp = activeEnemy.hp / 2;
                    activeEnemy.revived = true;
                    updateAllBattleUI();
                } else {
                    setTimeout(startPlayerTurn, 500);
                    return;
                }
            }
        }

        typingJp.style.display = 'none';
        typeTyped.style.display = 'none';
        typeUntyped.style.display = 'none';
        battleMessage.style.display = 'block';
        battleMessage.textContent = "相手のターン...";

        // 1秒待ってから攻撃実行
        setTimeout(() => {
            executeAttack(false);
        }, 1000);
    }

    function endBattle(isWin) {
        battleState.isActive = false;
        
        setTimeout(() => {
            if (isWin) {
                showRewardScreen();
            } else {
                modalLose.classList.add('active');
            }
        }, 1000);
    }

    btnCloseLose.addEventListener('click', () => {
        modalLose.classList.remove('active');
        showScreen(screenHome);
    });

    // ========================================================================
    // 報酬獲得画面ロジック
    // ========================================================================
    function showRewardScreen() {
        rewardGridContainer.innerHTML = "";
        
        // 敵チームから重複を排除して選択肢にする
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
            if (enemy.rarity === 'common') {
                card.classList.add('rarity-common');
            } else if (enemy.rarity === 'uncommon') {
                card.classList.add('rarity-uncommon');
            }

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
                showMessage(`${enemy.name}をゲットした！`);
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
