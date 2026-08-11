// ============================================================================
// システム管理クラス群 (メモリ維持対象。)
// ============================================================================

class GameDataManager {
    constructor() {
        this.playerName = localStorage.getItem('playerName') || null;
        
        // 初期データとして3種のスライムを所持している状態をセット。（テスト用に全解放）
        this.ownedSlimes = ["slime_01", "slime_02", "slime_03"];
        // 装備の初期状態（最大4枠）
        this.equippedSlimes = ["slime_01"]; 
    }

    savePlayerName(name) {
        this.playerName = name;
        localStorage.setItem('playerName', name);
    }

    getPlayerName() {
        return this.playerName;
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
// メモ: スライムの画像の取得ですが、「（スライムの名前）.png」という感じです。これはスクリプトにメモしておこう。
// ============================================================================
// キャラクターデータ (レアリティ: common, uncommon を追加)
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
        name: "オレンジスライム",
        rarity: "common",
        hp: 7,
        attack: 1,
        ability: "3回目の攻撃は攻撃力3倍（最大30までアップ可能）",
        image: "gazou/オレンジスライム.png"
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
// メインゲームロジック・UI制御
// ============================================================================

const gameData = new GameDataManager();
const collectionService = new BrainrotCollectionService();
const carryService = new BrainrotCarryService();
const moneyController = new MoneyDisplayController('money-display');

document.addEventListener('DOMContentLoaded', () => {
    // ---- 画面要素の取得 ----
    const screenNameInput = document.getElementById('screen-name-input');
    const screenHome = document.getElementById('screen-home');
    const screenPlay = document.getElementById('screen-play');
    const screenEquip = document.getElementById('screen-equip');
    const screenMatchmaking = document.getElementById('screen-matchmaking');
    const screenBattle = document.getElementById('screen-battle');
    
    // ---- UI要素の取得 ----
    const inputName = document.getElementById('player-name-input');
    const btnDecideName = document.getElementById('btn-decide-name');
    const displayPlayerName = document.getElementById('display-player-name');
    
    const btnSettings = document.getElementById('btn-settings');
    const btnPlay = document.getElementById('btn-play');
    const btnShop = document.getElementById('btn-shop');
    const btnEquip = document.getElementById('btn-equip');
    const btnCloseEquip = document.getElementById('btn-close-equip');

    // プレイモード画面のボタン
    const btnClosePlay = document.getElementById('btn-close-play');
    const btnVersusMode = document.getElementById('btn-versus-mode');
    const btnStoryMode = document.getElementById('btn-story-mode');

    // 装備画面用
    const searchSlimeInput = document.getElementById('search-slime');
    const equippedList = document.getElementById('equipped-list');
    const ownedList = document.getElementById('owned-list');

    // バトル画面用
    const battlePlayerTeam = document.getElementById('battle-player-team');
    const battleEnemyTeam = document.getElementById('battle-enemy-team');

    // モーダル関連
    const modalSettings = document.getElementById('modal-settings');
    const settingsNameInput = document.getElementById('settings-name-input');
    const btnUpdateName = document.getElementById('btn-update-name');
    const btnCloseSettings = document.getElementById('btn-close-settings');

    const modalCharaDetail = document.getElementById('modal-chara-detail');
    const btnCloseDetail = document.getElementById('btn-close-detail');
    const detailName = document.getElementById('detail-name');
    const detailRarity = document.getElementById('detail-rarity');
    const detailImage = document.getElementById('detail-image');
    const detailHp = document.getElementById('detail-hp');
    const detailAttack = document.getElementById('detail-attack');
    const detailAbility = document.getElementById('detail-ability');

    const modalMessage = document.getElementById('modal-message');
    const messageText = document.getElementById('message-text');
    const btnCloseMessage = document.getElementById('btn-close-message');

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
    // ホーム画面とプレイモードのロジック
    // ========================================================================

    btnPlay.addEventListener('click', () => {
        showScreen(screenPlay);
    });

    btnClosePlay.addEventListener('click', () => {
        showScreen(screenHome);
    });

    // 対戦モード（マッチメイキングロジック）
    btnVersusMode.addEventListener('click', () => {
        // 暗くするフェードイン処理
        screenMatchmaking.style.opacity = '0';
        showScreen(screenMatchmaking);
        
        // CSSトランジションを効かせるため少し遅延してopacityを1へ
        setTimeout(() => {
            screenMatchmaking.style.opacity = '1';
        }, 50);

        // 0.5〜1秒のランダムな待機時間後にバトル画面へ移行
        const waitTime = Math.floor(Math.random() * 500) + 500;
        
        setTimeout(() => {
            // フェードアウト開始
            screenMatchmaking.style.opacity = '0';
            
            setTimeout(() => {
                // バトル初期化と画面表示
                initBattle();
                showScreen(screenBattle);
            }, 500); // 0.5秒のフェードアウト後に切り替え
        }, waitTime + 500);
    });

    // ストーリーモード
    btnStoryMode.addEventListener('click', () => {
        showMessage('ストーリーモードは<br>開発中です！');
    });

    btnShop.addEventListener('click', () => {
        showMessage('ショップは<br>準備中です！');
    });

    // ========================================================================
    // 装備画面のロジック (最大4枠に変更)
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

        // 装備スロットの描画
        for (let i = 0; i < MAX_EQUIP; i++) {
            const slotId = gameData.equippedSlimes[i];
            if (slotId) {
                const charaInfo = characterDatabase.find(c => c.id === slotId);
                equippedList.appendChild(createCharaCard(charaInfo, true));
            } else {
                const emptySlot = document.createElement('div');
                emptySlot.className = 'chara-slot';
                emptySlot.textContent = '空き';
                equippedList.appendChild(emptySlot);
            }
        }

        // 持っているスライムの描画（検索フィルター対応）
        const filteredSlimes = characterDatabase.filter(chara => {
            const isOwned = gameData.ownedSlimes.includes(chara.id);
            const matchesSearch = chara.name.includes(filterText);
            return isOwned && matchesSearch;
        });

        filteredSlimes.forEach(chara => {
            ownedList.appendChild(createCharaCard(chara, false));
        });
    }

    // キャラクターカードDOM生成
    function createCharaCard(chara, isEquipped) {
        const card = document.createElement('div');
        card.className = 'chara-card';
        
        // レアリティに応じたクラス（背景色）を付与
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
        nameSpan.textContent = chara.name;

        card.appendChild(img);
        card.appendChild(nameSpan);

        // クリックで詳細（GUIモーダル）を表示
        card.addEventListener('click', () => {
            detailName.textContent = chara.name;
            
            // レアリティの表示テキストと色を変更
            if (chara.rarity === 'common') {
                detailRarity.textContent = '【 コモン 】';
                detailRarity.style.color = '#7F8C8D';
            } else if (chara.rarity === 'uncommon') {
                detailRarity.textContent = '【 アンコモン 】';
                detailRarity.style.color = '#27AE60';
            }

            detailImage.src = chara.image;
            detailHp.textContent = chara.hp;
            detailAttack.textContent = chara.attack;
            detailAbility.textContent = chara.ability;
            modalCharaDetail.classList.add('active');
        });

        return card;
    }

    btnCloseDetail.addEventListener('click', () => {
        modalCharaDetail.classList.remove('active');
    });

    searchSlimeInput.addEventListener('input', (e) => {
        renderEquipScreen(e.target.value);
    });

    // ========================================================================
    // バトル画面用の敵生成および配置ロジック
    // ========================================================================

    function initBattle() {
        battlePlayerTeam.innerHTML = "";
        battleEnemyTeam.innerHTML = "";

        // 1. プレイヤーの装備しているキャラを取得
        const playerSlimes = gameData.equippedSlimes
            .map(id => characterDatabase.find(c => c.id === id))
            .filter(chara => chara !== undefined);

        // もし装備が空の場合はフォールバックとしてスライムを入れる
        if (playerSlimes.length === 0) {
            playerSlimes.push(characterDatabase.find(c => c.id === "slime_01"));
        }

        // 2. プレイヤー側の最大レアリティを判定 (common = 1, uncommon = 2)
        let maxRarityNum = 1; 
        playerSlimes.forEach(chara => {
            if (chara.rarity === 'uncommon') maxRarityNum = 2;
        });

        // 3. 敵チームの編成（自分の装備数と同じ数だけ出現）
        const enemyCount = playerSlimes.length;
        const enemySlimes = [];

        for (let i = 0; i < enemyCount; i++) {
            let targetRarityNum = maxRarityNum;
            
            // 33%の確率で、プレイヤーの最大レアリティより1ランク上のレアリティが出現
            if (Math.random() < 0.33) {
                targetRarityNum += 1;
            }

            let targetRarity = targetRarityNum === 1 ? 'common' : 'uncommon';
            
            // 候補となる敵リストを絞り込み（該当レアリティがない場合のフェイルセーフ対応）
            let possibleEnemies = characterDatabase.filter(c => c.rarity === targetRarity);
            if (possibleEnemies.length === 0) {
                possibleEnemies = characterDatabase.filter(c => c.rarity === (maxRarityNum === 1 ? 'common' : 'uncommon'));
            }

            // ランダムに敵を1体選択
            const randomEnemy = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];
            enemySlimes.push(randomEnemy);
        }

        // 4. フィールドにDOMを描画する
        
        // 敵キャラの描画 (左側)
        enemySlimes.forEach(chara => {
            battleEnemyTeam.appendChild(createBattleIcon(chara));
        });

        // 自分のキャラの描画 (右側)
        playerSlimes.forEach(chara => {
            battlePlayerTeam.appendChild(createBattleIcon(chara));
        });
    }

    // バトルフィールド専用のアイコンDOM生成関数
    function createBattleIcon(chara) {
        const charaIcon = document.createElement('div');
        charaIcon.className = 'battle-chara';
        
        if (chara.rarity === 'common') {
            charaIcon.classList.add('rarity-common');
        } else if (chara.rarity === 'uncommon') {
            charaIcon.classList.add('rarity-uncommon');
        }

        const img = document.createElement('img');
        img.src = chara.image;
        img.alt = chara.name;
        img.onerror = function() {
            this.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"%3E%3Crect fill="%23ddd" width="60" height="60"/%3E%3Ctext fill="%23555" x="30" y="30" font-family="sans-serif" font-size="10" text-anchor="middle" dy="3"%3ENo Image%3C/text%3E%3C/svg%3E';
        };

        charaIcon.appendChild(img);
        return charaIcon;
    }

    // ゲーム開始。
    initGame();
});
