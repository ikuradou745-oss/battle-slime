// ============================================================================
// デモプロフィール用データ管理
// ============================================================================

const cT = 'transparent';
const cB = '#000000';
const cW = '#FFFFFF';
const cR = '#E74C3C';
const cBL = '#3498DB';
const cG = '#2ECC71';
const cY = '#F1C40F';
const cP = '#9B59B6';
const cO = '#E67E22';
const cS = '#87CEEB';

const DEMO_PROFILES = [
    {
        name: "スライム",
        profileData: [
            cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cB, cB, cB, cB, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cB, cBL, cBL, cBL, cBL, cB, cT, cT, cT, cT,
            cT, cT, cT, cB, cBL, cBL, cW, cBL, cW, cBL, cB, cT, cT, cT,
            cT, cT, cB, cBL, cBL, cBL, cB, cBL, cB, cBL, cBL, cB, cT, cT,
            cT, cB, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cB, cT,
            cT, cB, cBL, cBL, cBL, cB, cT, cT, cB, cBL, cBL, cBL, cB, cT,
            cB, cBL, cBL, cBL, cBL, cB, cB, cB, cB, cBL, cBL, cBL, cBL, cB,
            cB, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cB,
            cB, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cB,
            cT, cB, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cB, cT,
            cT, cT, cB, cB, cB, cB, cB, cB, cB, cB, cB, cB, cT, cT,
            cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT
        ]
    },
    {
        name: "ハート",
        profileData: [
            cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT,
            cT, cT, cB, cB, cB, cT, cT, cT, cT, cB, cB, cB, cT, cT,
            cT, cB, cR, cR, cR, cB, cT, cT, cB, cR, cR, cR, cB, cT,
            cB, cR, cR, cR, cW, cR, cB, cB, cR, cR, cR, cR, cR, cB,
            cB, cR, cR, cR, cR, cR, cR, cR, cR, cR, cR, cR, cR, cB,
            cB, cR, cR, cR, cR, cR, cR, cR, cR, cR, cR, cR, cR, cB,
            cT, cB, cR, cR, cR, cR, cR, cR, cR, cR, cR, cR, cB, cT,
            cT, cT, cB, cR, cR, cR, cR, cR, cR, cR, cR, cB, cT, cT,
            cT, cT, cT, cB, cR, cR, cR, cR, cR, cR, cB, cT, cT, cT,
            cT, cT, cT, cT, cB, cR, cR, cR, cR, cB, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cB, cR, cR, cB, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cB, cB, cT, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT
        ]
    },
    {
        name: "ソード",
        profileData: [
            cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cB, cT,
            cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cB, cT, cB,
            cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cB, cS, cB, cT,
            cT, cT, cT, cT, cT, cT, cT, cT, cT, cB, cS, cS, cB, cT,
            cT, cT, cT, cT, cT, cT, cT, cT, cB, cS, cS, cS, cB, cT,
            cT, cT, cT, cT, cT, cT, cT, cB, cS, cS, cS, cB, cT, cT,
            cT, cT, cT, cT, cT, cT, cB, cS, cS, cS, cB, cT, cT, cT,
            cT, cT, cT, cT, cT, cB, cS, cS, cS, cB, cT, cT, cT, cT,
            cT, cT, cT, cT, cB, cS, cS, cS, cB, cT, cT, cT, cT, cT,
            cT, cT, cB, cB, cB, cS, cS, cB, cB, cB, cT, cT, cT, cT,
            cT, cT, cB, cO, cB, cB, cB, cB, cO, cB, cT, cT, cT, cT,
            cT, cB, cT, cT, cB, cO, cO, cB, cT, cT, cB, cT, cT, cT,
            cT, cT, cT, cT, cT, cB, cO, cB, cT, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cB, cT, cT, cT, cT, cT, cT, cT
        ]
    },
    {
        name: "シールド",
        profileData: [
            cT, cT, cT, cB, cB, cB, cB, cB, cB, cB, cB, cT, cT, cT,
            cT, cT, cB, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cB, cT, cT,
            cT, cB, cBL, cBL, cW, cW, cBL, cBL, cW, cW, cBL, cBL, cB, cT,
            cT, cB, cBL, cBL, cW, cW, cBL, cBL, cW, cW, cBL, cBL, cB, cT,
            cT, cB, cBL, cBL, cW, cW, cBL, cBL, cW, cW, cBL, cBL, cB, cT,
            cT, cB, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cB, cT,
            cT, cT, cB, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cBL, cB, cT, cT,
            cT, cT, cB, cBL, cBL, cBL, cW, cW, cBL, cBL, cBL, cB, cT, cT,
            cT, cT, cT, cB, cBL, cBL, cW, cW, cBL, cBL, cB, cT, cT, cT,
            cT, cT, cT, cT, cB, cBL, cBL, cBL, cBL, cB, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cB, cBL, cBL, cB, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cB, cB, cT, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT
        ]
    },
    {
        name: "スター",
        profileData: [
            cT, cT, cT, cT, cT, cT, cT, cB, cT, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cB, cY, cB, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cB, cY, cB, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cB, cY, cY, cY, cB, cT, cT, cT, cT,
            cT, cB, cB, cB, cB, cB, cY, cY, cY, cB, cB, cB, cB, cB,
            cT, cT, cB, cY, cY, cY, cW, cY, cY, cY, cY, cY, cB, cT,
            cT, cT, cT, cB, cY, cY, cY, cY, cY, cY, cY, cB, cT, cT,
            cT, cT, cT, cT, cB, cY, cY, cY, cY, cY, cB, cT, cT, cT,
            cT, cT, cT, cB, cY, cY, cY, cY, cY, cY, cY, cB, cT, cT,
            cT, cT, cB, cY, cY, cY, cB, cB, cY, cY, cY, cY, cB, cT,
            cT, cT, cB, cY, cY, cB, cT, cT, cB, cY, cY, cB, cT, cT,
            cT, cB, cY, cB, cB, cT, cT, cT, cT, cB, cB, cY, cB, cT,
            cT, cB, cB, cT, cT, cT, cT, cT, cT, cT, cT, cB, cB, cT,
            cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT
        ]
    },
    {
        name: "スマイル",
        profileData: [
            cT, cT, cT, cT, cB, cB, cB, cB, cB, cB, cT, cT, cT, cT,
            cT, cT, cB, cB, cY, cY, cY, cY, cY, cY, cB, cB, cT, cT,
            cT, cB, cY, cY, cY, cY, cY, cY, cY, cY, cY, cY, cB, cT,
            cT, cB, cY, cY, cY, cY, cY, cY, cY, cY, cY, cY, cB, cT,
            cB, cY, cY, cB, cB, cY, cY, cY, cY, cB, cB, cY, cY, cB,
            cB, cY, cY, cB, cB, cY, cY, cY, cY, cB, cB, cY, cY, cB,
            cB, cY, cY, cY, cY, cY, cY, cY, cY, cY, cY, cY, cY, cB,
            cB, cY, cY, cY, cY, cY, cY, cY, cY, cY, cY, cY, cY, cB,
            cB, cY, cB, cY, cY, cY, cY, cY, cY, cY, cY, cB, cY, cB,
            cT, cB, cY, cB, cY, cY, cY, cY, cY, cY, cB, cY, cB, cT,
            cT, cB, cY, cY, cB, cB, cB, cB, cB, cB, cY, cY, cB, cT,
            cT, cT, cB, cB, cY, cY, cY, cY, cY, cY, cB, cB, cT, cT,
            cT, cT, cT, cT, cB, cB, cB, cB, cB, cB, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT
        ]
    },
    {
        name: "ツリー",
        profileData: [
            cT, cT, cT, cT, cT, cT, cB, cT, cT, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cB, cG, cB, cT, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cB, cG, cG, cG, cB, cT, cT, cT, cT, cT,
            cT, cT, cT, cB, cG, cW, cG, cG, cG, cB, cT, cT, cT, cT,
            cT, cT, cT, cT, cB, cG, cG, cG, cB, cT, cT, cT, cT, cT,
            cT, cT, cT, cB, cG, cG, cG, cG, cG, cB, cT, cT, cT, cT,
            cT, cT, cB, cG, cW, cG, cG, cG, cG, cG, cB, cT, cT, cT,
            cT, cT, cT, cB, cB, cG, cG, cG, cB, cB, cT, cT, cT, cT,
            cT, cT, cB, cG, cG, cG, cG, cG, cG, cG, cB, cT, cT, cT,
            cT, cB, cG, cW, cG, cG, cG, cG, cG, cG, cG, cB, cT, cT,
            cT, cB, cB, cB, cB, cB, cO, cO, cB, cB, cB, cB, cB, cT,
            cT, cT, cT, cT, cT, cB, cO, cO, cB, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cB, cO, cO, cB, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cB, cB, cB, cB, cT, cT, cT, cT, cT
        ]
    },
    {
        name: "サン",
        profileData: [
            cT, cT, cT, cT, cT, cB, cT, cT, cB, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cB, cB, cT, cT, cT, cT, cT, cT,
            cT, cT, cB, cT, cB, cY, cY, cY, cY, cB, cT, cB, cT, cT,
            cT, cT, cT, cB, cY, cY, cY, cY, cY, cY, cB, cT, cT, cT,
            cT, cT, cB, cY, cY, cB, cY, cY, cB, cY, cY, cB, cT, cT,
            cB, cT, cY, cY, cY, cB, cY, cY, cB, cY, cY, cY, cT, cB,
            cT, cB, cY, cY, cY, cY, cY, cY, cY, cY, cY, cY, cB, cT,
            cT, cB, cY, cY, cY, cB, cY, cY, cB, cY, cY, cY, cB, cT,
            cB, cT, cY, cY, cY, cY, cB, cB, cY, cY, cY, cY, cT, cB,
            cT, cT, cB, cY, cY, cY, cY, cY, cY, cY, cY, cB, cT, cT,
            cT, cT, cT, cB, cY, cY, cY, cY, cY, cY, cB, cT, cT, cT,
            cT, cT, cB, cT, cB, cY, cY, cY, cY, cB, cT, cB, cT, cT,
            cT, cT, cT, cT, cT, cT, cB, cB, cT, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cB, cT, cT, cB, cT, cT, cT, cT, cT
        ]
    },
    {
        name: "ムーン",
        profileData: [
            cT, cT, cT, cT, cT, cT, cT, cB, cB, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cB, cY, cY, cY, cB, cT, cT, cT, cT,
            cT, cT, cT, cT, cB, cY, cY, cY, cY, cB, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cB, cB, cY, cY, cY, cB, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cT, cB, cY, cY, cB, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cT, cB, cY, cY, cB, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cT, cB, cY, cY, cB, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cT, cB, cY, cY, cB, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cT, cB, cY, cY, cB, cT, cT, cT,
            cT, cT, cT, cT, cT, cB, cB, cY, cY, cY, cB, cT, cT, cT,
            cT, cT, cT, cT, cB, cY, cY, cY, cY, cB, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cB, cY, cY, cY, cB, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cT, cB, cB, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT, cT
        ]
    },
    {
        name: "ポーション",
        profileData: [
            cT, cT, cT, cT, cT, cB, cB, cB, cB, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cB, cO, cO, cB, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cB, cW, cW, cB, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cT, cB, cW, cW, cB, cT, cT, cT, cT, cT,
            cT, cT, cT, cT, cB, cW, cW, cW, cW, cB, cT, cT, cT, cT,
            cT, cT, cT, cB, cW, cW, cW, cW, cW, cW, cB, cT, cT, cT,
            cT, cT, cB, cW, cW, cW, cW, cW, cW, cW, cW, cB, cT, cT,
            cT, cT, cB, cP, cP, cP, cP, cP, cP, cP, cP, cB, cT, cT,
            cT, cB, cP, cP, cW, cW, cP, cP, cP, cP, cP, cP, cB, cT,
            cT, cB, cP, cP, cP, cP, cP, cP, cP, cP, cP, cP, cB, cT,
            cT, cB, cP, cP, cP, cP, cP, cP, cP, cP, cP, cP, cB, cT,
            cT, cT, cB, cP, cP, cP, cP, cP, cP, cP, cP, cB, cT, cT,
            cT, cT, cT, cB, cB, cP, cP, cP, cP, cB, cB, cT, cT, cT,
            cT, cT, cT, cT, cT, cB, cB, cB, cB, cT, cT, cT, cT, cT
        ]
    }
];
