// ============================================================================
// システム管理クラス群 (メモリ維持対象)
// ============================================================================

class GameDataManager {
    constructor() {
        this.playerName = localStorage.getItem('playerName') || null;
        // 初期データとしてスライムを所持し、装備している状態をセット
        this.ownedSlimes = ["slime_01"];
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
// キャラクターデータ
// ============================================================================

const characterDatabase = [
    {
        id: "slime_01",
        name: "スライム",
        hp: 10,
        attack: 1,
        ability: "一回だけ死んでもHPを半分にして復活する",
        image: "gazou/スライム.png"
    }
    // 今後新しいキャラを追加する場合はここに追記していきます
];

// ============================================================================
// メインゲームロジック・UI制御
// ============================================================================

const gameData = new GameDataManager();
const collectionService = new BrainrotCollectionService();
const carryService = new BrainrotCarryService();
const moneyController = new MoneyDisplayController('money-display');

document.addEventListener('DOMContentLoaded', () => {
    // 画面要素の取得
    const screenNameInput = document.getElementById('screen-name-input');
    const screenHome = document.getElementById('screen-home');
    const screenEquip = document.getElementById('screen-equip');
    
    const inputName = document.getElementById('player-name-input');
    const btnDecideName = document.getElementById('btn-decide-name');
    const displayPlayerName = document.getElementById('display-player-name');
    
    const btnSettings = document.getElementById('btn-settings');
    const btnPlay = document.getElementById('btn-play');
    const btnShop = document.getElementById('btn-shop');
    const btnEquip = document.getElementById('btn-equip');
    const btnCloseEquip = document.getElementById('btn-close-equip');

    const modalPlayMode = document.getElementById('modal-play-mode');
    const btnClosePlayModal = document.getElementById('btn-close-play-modal');

    const searchSlimeInput = document.getElementById('search-slime');
    const equippedList = document.getElementById('equipped-list');
    const ownedList = document.getElementById('owned-list');

    // 画面切り替え関数
    function showScreen(screenElement) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screenElement.classList.add('active');
    }

    // 初期化処理（名前登録済みかどうかで画面を出し分け）
    function initGame() {
        moneyController.updateDisplay(); // 所持金表示を更新
        
        if (gameData.getPlayerName()) {
            displayPlayerName.textContent = gameData.getPlayerName();
            showScreen(screenHome);
        } else {
            showScreen(screenNameInput);
        }
    }

    // 名前入力ロジック (3文字以上12文字以下)
    function validateAndSaveName(nameString) {
        const trimmedName = nameString.trim();
        if (trimmedName.length >= 3 && trimmedName.length <= 12) {
            gameData.savePlayerName(trimmedName);
            displayPlayerName.textContent = trimmedName;
            showScreen(screenHome);
        } else {
            alert('名前は3文字以上、12文字以下で入力してください。');
        }
    }

    btnDecideName.addEventListener('click', () => {
        validateAndSaveName(inputName.value);
    });

    // 設定（⚙️）ボタンでの名前変更ロジック
    btnSettings.addEventListener('click', () => {
        const newName = prompt('新しい名前を入力してください（3文字以上12文字以下）', gameData.getPlayerName());
        if (newName !== null) {
            validateAndSaveName(newName);
        }
    });

    // ホーム画面のボタンロジック
    btnPlay.addEventListener('click', () => {
        modalPlayMode.classList.add('active');
    });

    btnClosePlayModal.addEventListener('click', () => {
        modalPlayMode.classList.remove('active');
    });

    btnShop.addEventListener('click', () => {
        alert('準備中');
    });

    // 装備画面のロジック
    btnEquip.addEventListener('click', () => {
        renderEquipScreen();
        showScreen(screenEquip);
    });

    btnCloseEquip.addEventListener('click', () => {
        showScreen(screenHome);
    });

    // 装備画面のレンダリング
    function renderEquipScreen(filterText = "") {
        equippedList.innerHTML = "";
        ownedList.innerHTML = "";

        // 最大8キャラ分の装備スロットを描画
        const MAX_EQUIP = 8;
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
        
        const img = document.createElement('img');
        img.src = chara.image;
        img.alt = chara.name;
        // 画像がない場合のエラーハンドリング
        img.onerror = function() {
            this.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"%3E%3Crect fill="%23ddd" width="60" height="60"/%3E%3Ctext fill="%23555" x="30" y="30" font-family="sans-serif" font-size="10" text-anchor="middle" dy="3"%3ENo Image%3C/text%3E%3C/svg%3E';
        };

        const nameSpan = document.createElement('span');
        nameSpan.className = 'chara-name';
        nameSpan.textContent = chara.name;

        card.appendChild(img);
        card.appendChild(nameSpan);

        // クリックで詳細（ステータス）を表示するデモ
        card.addEventListener('click', () => {
            alert(`【${chara.name}】\nHP: ${chara.hp}\n攻撃力: ${chara.attack}\n能力: ${chara.ability}`);
        });

        return card;
    }

    // 検索窓のリアルタイムフィルタリング
    searchSlimeInput.addEventListener('input', (e) => {
        renderEquipScreen(e.target.value);
    });

    // ゲーム開始
    initGame();
});
