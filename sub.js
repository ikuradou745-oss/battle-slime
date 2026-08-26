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
// 3. レア (青 / 青色)           - レアリティ数値: 3 (※水晶スライム、ライフスライム、スライムソード、スライムシールド)
// 4. レジェンド (黄色 / 黄金)   - レアリティ数値: 4 (※フライングスライム、マネースライム、ハンマースライム、ケアスライム、ファイタースライム)
//
// 【メモ】対戦モードの敵スライム出現仕様
// ・基本はプレイヤーのレアリティに応じて選出されますが、上位レアリティほど低確率になります。
// ・「次のレアリティのスライムが出現する条件」:
//   - コモンのスライムを3体以上所持 -> アンコモンの敵が出現可能
//   - アンコモンのスライムを3体以上所持 -> レアの敵が出現可能
//   - レアのスライムを3体以上所持 -> レジェンドの敵が出現可能
//
// 【メモ】勝利時のお金獲得計算式
// 試合に勝利した時の獲得金額:
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

// レベルに応じたステータス計算関数
function getSlimeStats(slimeBase, level = 1) {
    const validLevel = Math.max(1, Math.min(50, level));
    const multiplier = 1 + (validLevel - 1) * 0.05;
    const hp = Math.round(slimeBase.hp * multiplier * 10) / 10;
    const attack = Math.round(slimeBase.attack * multiplier * 10) / 10;
    return { hp, attack, level: validLevel };
}

// レアリティ定義オブジェクト
const RARITY_CONFIG = {
    common: { name: "コモン", value: 1, color: "#BDC3C7", textColor: "#000" },
    uncommon: { name: "アンコモン", value: 2, color: "#2ECC71", textColor: "#000" },
    rare: { name: "レア", value: 3, color: "#3498DB", textColor: "#FFF" },
    legend: { name: "レジェンド", value: 4, color: "#F1C40F", textColor: "#000" }
};

// ============================================================================
// キャラクターデータ一覧 (全14種類・4段階レアリティ)
// ============================================================================
const characterDatabase = [
    // --- 1. コモン (レアリティ数値: 1 / グレー) ---
    {
        id: "slime_01",
        name: "スライム",
        rarity: "common",
        hp: 10,
        attack: 1,
        ability: "一回だけ死んでもHPを半分にして復活する",
        image: "./gazou/スライム.png"
    },
    {
        id: "slime_02",
        name: "イエロースライム",
        rarity: "common",
        hp: 7,
        attack: 1,
        ability: "3回目の攻撃は攻撃力3倍（最大30までアップ可能）",
        image: "./gazou/イエロースライム.png"
    },

    // --- 2. アンコモン (レアリティ数値: 2 / 緑) ---
    {
        id: "slime_03",
        name: "グリーンスライム",
        rarity: "uncommon",
        hp: 10,
        attack: 1,
        ability: "相手を3ターン毒状態にする（毒状態になると毎ターン1ダメージ喰らいます。）",
        image: "./gazou/グリーンスライム.png"
    },
    {
        id: "slime_04",
        name: "マゼンタスライム",
        rarity: "uncommon",
        hp: 8,
        attack: 1,
        ability: "3回の攻撃に1回「レーザー攻撃」を行う（攻撃力1.5）。相手を1ターン気絶させる。",
        image: "./gazou/magentaslime.png"
    },
    {
        id: "slime_06",
        name: "オレンジスライム",
        rarity: "uncommon",
        hp: 12,
        attack: 0.9,
        ability: "攻撃時、相手を3ターン燃やす。燃焼で3回ダメージを受けると1ターン行動不可になる。",
        image: "./gazou/orangeslime.png"
    },

    // --- 3. レア (レアリティ数値: 3 / 青) ---
    {
        id: "slime_05",
        name: "スライムソード",
        rarity: "rare",
        hp: 10,
        attack: 2,
        ability: "死亡時、相手を切りつけて通常攻撃力の3倍のダメージを与える。",
        image: "./gazou/slimesword.png"
    },
    {
        id: "slime_07",
        name: "ライフスライム",
        rarity: "rare",
        hp: 15,
        attack: 0.9,
        ability: "生命力に満ちており、毎ターン開始時に自身のHPを1回復する",
        image: "./gazou/lifeslime.png"
    },
    {
        id: "slime_08",
        name: "スライムシールド",
        rarity: "rare",
        hp: 18,
        attack: 1.2,
        ability: "強固な盾で身を守り、受けるダメージを常に0.5軽減する",
        image: "./gazou/slimeshield.png"
    },
    {
        id: "slime_10",
        name: "水晶スライム",
        rarity: "rare",
        hp: 12,
        attack: 1.2,
        ability: "水晶の魔力でステータスが高く、25%の確率でクリティカル大打撃を与える",
        image: "./gazou/suisyouslime.png"
    },

    // --- 4. レジェンド (レアリティ数値: 4 / 黄色) ---
    {
        id: "slime_09",
        name: "フライングスライム",
        rarity: "legend",
        hp: 15,
        attack: 1.5,
        ability: "軽快な飛行で相手の攻撃を翻弄し、素早い連続攻撃を仕掛ける",
        image: "./gazou/flyingslime.png"
    },
    {
        id: "slime_11",
        name: "マネースライム",
        rarity: "legend",
        hp: 16,
        attack: 2.2,
        ability: "黄金のオーラを纏い、強力な打撃とともに戦場を圧倒する",
        image: "./gazou/moneyslime.png"
    },
    {
        id: "slime_12",
        name: "ハンマースライム",
        rarity: "legend",
        hp: 13,
        attack: 1.5,
        ability: "最初のターンにHP8の壁を出す（壁召喚時は攻撃不可）。壁が壊れたら3ターン後に復活する。",
        image: "./gazou/hammerslime.png"
    },
    {
        id: "slime_13",
        name: "ケアスライム",
        rarity: "legend",
        hp: 15,
        attack: 0.6,
        ability: "最初のターンに生存している味方全員の最大HP+15%(HPも増加)。死亡時、次の味方1体に2ターン25%軽減バリア(🛡️)を付与。",
        image: "./gazou/careslime.png"
    },
    {
        id: "slime_14",
        name: "ファイタースライム",
        rarity: "legend",
        hp: 19.5,
        attack: 2.0,
        ability: "4ターンに1回力を溜めて次の攻撃力3倍(溜め時は行動不可)。HPが8割を切ると受けるダメージを50%軽減。",
        image: "./gazou/fighterslime.png"
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
    { jp: "けん", en: "ken" },
    { jp: "らいふ", en: "raifu" },
    { jp: "れじぇんど", en: "rejendo" },
    { jp: "こもん", en: "komon" },
    { jp: "あんこもん", en: "ankomon" },
    { jp: "れあ", en: "rea" },
    { jp: "しょうり", en: "syouri" },
    { jp: "おかね", en: "okane" },
    { jp: "すぴーど", en: "supi-do" }
];

// ============================================================================
// アニメーション用ヘルパー関数と動的CSS (sub.js担当)
// ============================================================================

// 能力発動テキスト表示アニメーション
function showAbilityText(dom, text = "能力発動", battleSpeed = 1) {
    if (!dom) return;
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
    }, 1000 / battleSpeed);
}

// レーザーアニメーション
function playLaserAnimation(attackerDom, defenderDom, speed = 1) {
    if (!attackerDom || !defenderDom) return;
    const aRect = attackerDom.getBoundingClientRect();
    const dRect = defenderDom.getBoundingClientRect();
    
    const laser = document.createElement('div');
    laser.className = 'laser-beam';
    
    const startX = aRect.left + aRect.width / 2;
    const startY = aRect.top + aRect.height / 2;
    const endX = dRect.left + dRect.width / 2;
    const endY = dRect.top + dRect.height / 2;
    
    const length = Math.hypot(endX - startX, endY - startY);
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
    
    laser.style.left = `${startX}px`;
    laser.style.top = `${startY}px`;
    laser.style.width = `0px`;
    laser.style.transform = `rotate(${angle}deg)`;
    laser.style.transition = `width ${0.2 / speed}s linear`;
    
    document.body.appendChild(laser);
    
    setTimeout(() => {
        laser.style.width = `${length}px`;
    }, 10);
    
    setTimeout(() => {
        laser.remove();
    }, 300 / speed);
}

// 切りつけアニメーション
function playSlashAnimation(targetDom, speed = 1) {
    if (!targetDom) return;
    const tRect = targetDom.getBoundingClientRect();
    const slash = document.createElement('div');
    slash.className = 'slash-effect';
    
    const cx = tRect.left + tRect.width / 2;
    const cy = tRect.top + tRect.height / 2;
    
    slash.style.left = `${cx - 50}px`;
    slash.style.top = `${cy - 50}px`;
    slash.style.animationDuration = `${0.3 / speed}s`;
    
    document.body.appendChild(slash);
    
    setTimeout(() => {
        slash.remove();
    }, 300 / speed);
}

// 回復アニメーション
function playHealAnimation(targetDom, text = '💚+1', speed = 1) {
    if (!targetDom) return;
    const tRect = targetDom.getBoundingClientRect();
    const heal = document.createElement('div');
    heal.className = 'heal-effect';
    heal.textContent = text;
    
    const cx = tRect.left + tRect.width / 2;
    const cy = tRect.top;
    
    heal.style.left = `${cx - 30}px`;
    heal.style.top = `${cy - 10}px`;
    
    document.body.appendChild(heal);
    
    setTimeout(() => {
        heal.remove();
    }, 600 / speed);
}

// 壁生成・防御アニメーション
function playWallAnimation(targetDom, text = '🧱HP8の壁!', speed = 1) {
    if (!targetDom) return;
    const tRect = targetDom.getBoundingClientRect();
    const wall = document.createElement('div');
    wall.className = 'wall-effect';
    wall.textContent = text;

    const cx = tRect.left + tRect.width / 2;
    const cy = tRect.top;

    wall.style.left = `${cx - 40}px`;
    wall.style.top = `${cy - 20}px`;

    document.body.appendChild(wall);

    setTimeout(() => {
        wall.remove();
    }, 800 / speed);
}

// バリア付与アニメーション
function playBarrierAnimation(targetDom, text = '🛡️25%バリア!', speed = 1) {
    if (!targetDom) return;
    const tRect = targetDom.getBoundingClientRect();
    const barrier = document.createElement('div');
    barrier.className = 'barrier-effect';
    barrier.textContent = text;

    const cx = tRect.left + tRect.width / 2;
    const cy = tRect.top;

    barrier.style.left = `${cx - 50}px`;
    barrier.style.top = `${cy - 20}px`;

    document.body.appendChild(barrier);

    setTimeout(() => {
        barrier.remove();
    }, 800 / speed);
}

// アニメーション用動的CSSスタイルの追加
(function initAnimationStyles() {
    if (typeof document === 'undefined') return;
    const animStyle = document.createElement('style');
    animStyle.textContent = `
        .laser-beam {
            position: fixed;
            height: 6px;
            background-color: #FF00FF;
            box-shadow: 0 0 10px #FF00FF, 0 0 20px #FF00FF;
            z-index: 9999;
            transform-origin: left center;
            pointer-events: none;
        }
        .slash-effect {
            position: fixed;
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.9) 50%, transparent 60%);
            z-index: 9999;
            pointer-events: none;
            animation: slashAnim forwards;
        }
        .heal-effect, .wall-effect, .barrier-effect {
            position: fixed;
            font-size: 18px;
            font-weight: 900;
            text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000;
            z-index: 9999;
            pointer-events: none;
            animation: floatUpAnim 0.8s ease-out forwards;
        }
        .heal-effect { color: #2ECC71; }
        .wall-effect { color: #E67E22; font-size: 17px; }
        .barrier-effect { color: #3498DB; font-size: 17px; }

        @keyframes slashAnim {
            0% { opacity: 0; transform: scale(0.5) rotate(-45deg); }
            50% { opacity: 1; transform: scale(1.2) rotate(15deg); }
            100% { opacity: 0; transform: scale(1.5) rotate(45deg); }
        }
        @keyframes floatUpAnim {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            50% { transform: translateY(-15px) scale(1.1); }
            100% { opacity: 0; transform: translateY(-35px) scale(0.9); }
        }
    `;
    document.head.appendChild(animStyle);
})();
