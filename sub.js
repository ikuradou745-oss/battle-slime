// ============================================================================
// キャラクターデータ
// ============================================================================

const characterDatabase = [
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
        id: "slime_05",
        name: "スライムソード",
        rarity: "rare",
        hp: 10,
        attack: 2,
        ability: "死亡時、相手を切りつけて通常攻撃力の3倍のダメージを与える。",
        image: "./gazou/slimesword.png"
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
    {
        id: "slime_07",
        name: "スライムシールド",
        rarity: "rare",
        hp: 20,
        attack: 0.5,
        ability: "3ターンに1回、攻撃をせずに1ターン「守り」の体制に入り、ダメージを50%カットする。",
        image: "./gazou/slimeshield.png"
    },
    {
        id: "slime_08",
        name: "水晶スライム",
        rarity: "rare",
        hp: 12,
        attack: 1.1,
        ability: "攻撃した時、相手を2ターンに1度「氷」状態にする（攻撃力25%減少、3ターン目は行動不能になる）。",
        image: "./gazou/suisyouslime.png"
    },
    {
        id: "slime_09",
        name: "飛行スライム",
        rarity: "legendary",
        hp: 10.5,
        attack: 2.5,
        ability: "2ターンに1回攻撃を回避する。4ターンに1回上から落下する攻撃を行い、ダメージが2倍になる。",
        image: "./gazou/flyingslime.png"
    },
    {
        id: "slime_10",
        name: "ライフスライム",
        rarity: "epic",
        hp: 15,
        attack: 1.2,
        ability: "3ターンに1度、最大HPの18%を回復する。一度だけ、死亡した仲間をHP1で復活させる（手持ちにいるだけで発動）。",
        image: "./gazou/lifeslime.png"
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
// アニメーション用ヘルパー関数と動的CSS
// ============================================================================

// レーザーアニメーション
function playLaserAnimation(attackerDom, defenderDom, speed) {
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
function playSlashAnimation(targetDom, speed) {
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

// 落下攻撃アニメーション
function playJumpAttackAnimation(attackerDom, speed) {
    if (!attackerDom) return;
    attackerDom.style.transition = `transform ${0.2 / speed}s ease-out`;
    attackerDom.style.transform = `translateY(-150px) scale(1.2)`;
    
    setTimeout(() => {
        attackerDom.style.transition = `transform ${0.1 / speed}s ease-in`;
        attackerDom.style.transform = `translateY(20px) scale(1.1)`; 
        setTimeout(() => {
            attackerDom.style.transition = `transform ${0.2 / speed}s ease-out`;
            attackerDom.style.transform = `translateY(0) scale(1)`; 
        }, 100 / speed);
    }, 200 / speed);
}

// 動的CSSの追加
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
    @keyframes slashAnim {
        0% { opacity: 0; transform: scale(0.5) rotate(-45deg); }
        50% { opacity: 1; transform: scale(1.2) rotate(15deg); }
        100% { opacity: 0; transform: scale(1.5) rotate(45deg); }
    }
`;
document.head.appendChild(animStyle);
