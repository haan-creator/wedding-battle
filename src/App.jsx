import { useState, useEffect, useRef, useCallback } from "react";

/* ============================================================
    婚禮大亂鬥 Wedding Battle — 可玩版 v3
   手繪醜萌角色 × 像素場景混搭・火爆指數計分・RPG 對話框
   ============================================================ */

/* ---------- 遊戲資料 ---------- */

const ELDERS = [
  { id: "e1", name: "陳英珠阿姨", specialty: "催婚專家", skill: "「你看隔壁小美都生第二胎了」連擊", stats: { attack: 5, defense: 3, stealth: 2, speed: 2 } },
  { id: "e2", name: "林水泉阿北", specialty: "薪水偵探", skill: "「一個月賺多少？」穿透防禦", stats: { attack: 4, defense: 2, stealth: 3, speed: 3 } },
  { id: "e3", name: "王秀蘭姑姑", specialty: "比較王", skill: "「你表哥在竹科年薪兩百萬」群嘲", stats: { attack: 4, defense: 4, stealth: 2, speed: 2 } },
  { id: "e4", name: "張金發叔公", specialty: "勸酒大師", skill: "「不喝是看不起我」持續傷害", stats: { attack: 3, defense: 3, stealth: 4, speed: 2 } },
];

const YOUTHS = [
  { id: "y1", name: "小玲", specialty: "社恐結界・新娘閨蜜", skill: "「不好意思我要去上廁所」完美迴避", stats: { attack: 2, defense: 5, stealth: 3, speed: 3 } },
  { id: "y2", name: "阿凱", specialty: "話題轉移・新郎兄弟", skill: "「叔叔你這西裝哪裡買的？」反轉注意力", stats: { attack: 3, defense: 4, stealth: 2, speed: 4 } },
  { id: "y3", name: "學姊 Mia", specialty: "回嗆語錄資料庫", skill: "「那阿姨你當年幾歲生的？」反擊", stats: { attack: 5, defense: 3, stealth: 2, speed: 3 } },
  { id: "y4", name: "DJ 小胖", specialty: "場控專家", skill: "音樂轉超大聲，強制中斷對話", stats: { attack: 3, defense: 3, stealth: 1, speed: 5 } },
];

const ALL_CHARS = [...ELDERS, ...YOUTHS];

/* 入席卡台詞與等級（選角畫面用） */
/* 入席台詞：刻意跟每個角色自己的必殺技引句不同（取自遊戲既有語料），
   避免選角卡上方對話框跟下方必殺技顯示同一句話 */
const CHAR_QUOTES = {
  e1: "什麼時候結婚？",
  e2: "買房了沒？",
  e3: "吃這麼少，難怪這麼瘦",
  e4: "早生貴子！",
  y1: "叔叔阿姨那邊有卡拉OK喔，不是很好嗎～",
  y2: "叔叔你這領帶好好看！跟你上次報的明牌一樣澎欸",
  y3: "阿姨那你兒子呢？40 了還沒對象？",
  y4: "（音量轉到最大）阿姨你說什麼？聽不到～",
};
const CHAR_LV = { e1: 63, e2: 58, e3: 60, e4: 65, y1: 24, y2: 27, y3: 28, y4: 25 };

const MINE_PHRASES = [
  { id: "m1", text: "有對象了嗎？", severity: "mild", fine: 200, category: "感情盤查" },
  { id: "m2", text: "吃這麼少，難怪這麼瘦", severity: "mild", fine: 200, category: "身材評論" },
  { id: "m3", text: "什麼時候結婚？", severity: "medium", fine: 500, category: "催婚" },
  { id: "m4", text: "一個月薪水多少？", severity: "medium", fine: 500, category: "詢問薪資" },
  { id: "m5", text: "買房了沒？", severity: "medium", fine: 500, category: "房產盤查" },
  { id: "m6", text: "早生貴子！", severity: "severe", fine: 1000, category: "催生" },
  { id: "m7", text: "什麼時候生小孩？", severity: "severe", fine: 1000, category: "催生" },
  { id: "m8", text: "不生以後老了怎麼辦？", severity: "severe", fine: 1000, category: "催生恐嚇" },
  { id: "m9", text: "你看隔壁小美都生第二胎了", severity: "fatal", fine: 2000, category: "比較式催生" },
  { id: "m10", text: "女生最重要的就是嫁個好老公", severity: "fatal", fine: 2000, category: "觀念地雷" },
];

const SAFE_PHRASES = ["今天天氣真好啊！", "這個菜不錯吃～", "新娘子今天好漂亮！", "你這衣服很好看欸！"];
/* NPC 回話語錄（Fable 新增） */
const RPSAFE = ["對啊～天氣超好的", "謝謝阿姨～您也很美", "哈哈是啊是啊（友善微笑）", "真的！這個超好吃"];
const RPHIT = ["？？？阿姨我們有很熟嗎", "（玻璃心碎裂的聲音）", "保鏢！就是這位！", "蛤？關你什麼事…喔不是，呵呵"];
const RPDODGE = ["哈哈～是噢（左耳進右耳出）", "嗯嗯我再想想～（已讀）", "阿姨說得對（眼神放空）", "緣分到了就會有了啦～（微笑.jpg）", "哇～（開始滑手機）"];
const ERPLY = { s1: "哎喲～就早睡多喝水啦（講不停模式啟動）", s2: "真的嗎？（馬上整理頭髮）", s3: "……（玻璃心碎裂）", s4: "這氣泡水…怎麼有點上頭，跟你說喔其實…", s5: "唉喲乖～不哭不哭，阿姨請你吃喜糖", s6: "對焦？時程？你是要拍照喔？？", s7: "脈輪？！我、我哪裡堵塞了？", s8: "……（系統當機中）" };
const ERPX = { s3: "dead", s6: "shock", s7: "shock", s8: "shock" };
const CRPLY = { c1: ["我、我那時候時代不一樣啦！", "shock"], c2: ["這領帶噢～東區買的…欸等等你什麼意思？", null], c3: ["我婆婆喔……（陷入當年回憶，眼神放空）", null], c4: ["你、你這樣很沒禮貌欸！（氣到發抖）", "shock"], c5: ["……（原地暴斃，靈魂飄出）", "dead"], c6: ["欸？？紅包還能這樣用？！", "shock"] };
const ELDER_MALE = new Set(["e2", "e4"]);
/* 依長輩性別轉換稱呼：阿姨叔叔、她他、很美很帥 */
const gline = (t, elder) => {
  const eid = typeof elder === "string" ? elder : elder && elder.id;
  if (!ELDER_MALE.has(eid)) return t;
  return t.replace(/阿姨/g, "\u0001").replace(/叔叔/g, "阿姨").replace(/\u0001/g, "叔叔").replace(/她/g, "他").replace(/您也很美/g, "您也很帥");
};
const cardLine = (c, elder) => {
  const eid = typeof elder === "string" ? elder : elder && elder.id;
  const male = ELDER_MALE.has(eid);
  const call = male ? "叔叔" : "阿姨";
  if (c.id === "c1" && male) return "「那叔叔你當年幾歲結婚的？」";
  if (c.id === "c2" && !male) return "「阿姨你這髮型好好看！跟你上次報的明牌一樣澎欸」";
  return c.line.replace(/阿姨|叔叔/g, call);
};

const CIGN = ["哼，不回話就是默認啦～", "看吧，我就說年輕人講不贏我"];

/* 長輩區場景互動台詞（本次新增） */
const EZLINES = {
  sofa: ["啊～累了！坐一下，嘿咻～", "這沙發…就是讚啦", "呼…腳麻去，揉一下"],
  table: ["這個魚很好吃，呷看麥！", "菜怎麼都沒人吃？來來來", "水果賀甲！很甜呢～"],
  tea: ["好渴…有什麼飲料？", "醫生說我不能喝太甜的啦", "這高山烏龍，有回甘喔～"],
};
const EZREPLY = {
  sofa: { npc: "e1", lines: ["來來這邊坐！少年仔都不懂享受", "這咖啡色的最好坐，跟你說"] },
  table: { npc: "e4", lines: ["對啊！這攤辦桌師傅手藝一流", "來！這杯敬你！…呃你不喝喔"] },
  tea: { npc: "e2", lines: ["高山的啦！我自己泡的", "無糖的在左邊，醫生有交代齁"] },
};

/* 柵欄邊喊話 */
const ELDER_SHOUTS = [
  { line: "那邊的年輕人！菜都沒吃完不要浪費！", v: 50 },
  { line: "音樂開這麼大聲，耳朵不要了是不是！", v: 80 },
  { line: "這邊有紅包喔～要不要過來拿？", lure: true },
];
const YOUTH_SHOUTS = [
  { line: "叔叔阿姨那邊有卡拉OK喔，不是很好嗎～", v: 50 },
  { line: "阿姨！你孫子在這邊找你！", v: 80 },
  { line: "我們這邊的菜其實…沒有很好吃啦", lure: true },
];

/* 年輕人誘餌（長輩可設） */
const YBAITS = [
  { name: "免費塔羅占卜", joke: "「水逆特別場限額 5 名」——嘴上說不信，腳已經排隊" },
  { name: "免費精釀啤酒", joke: "「免費」＋「限量」直接失去理智" },
  { name: "現炸鹽酥雞攤", joke: "再厭世也無法拒絕免費炸物" },
  { name: "頌缽療癒體驗", joke: "「我就體驗五分鐘而已」" },
  { name: "免費充電站", joke: "手機剩 12% 的人毫無抵抗力" },
  { name: "隱藏版千層蛋糕", joke: "為了一張照片可以背叛任何人" },
];

/* 塔羅牌 */
const TAROTS = [
  { id: "wheel", name: "正位・命運之輪", desc: "下次警報時，偽裝的長輩會緊張冒汗（提示）", joke: "宇宙站在你這邊" },
  { id: "power", name: "正位・力量", desc: "下一張回嗆卡威力 ×1.5", joke: "你的嘴充滿宇宙能量" },
  { id: "tower", name: "逆位・塔", desc: "水逆纏身：下次搭話必定被識破", joke: "表示冷靜但手在抖" },
  { id: "moon", name: "逆位・月亮", desc: "……什麼事都沒發生", joke: "宇宙今天已讀不回" },
];

const SPOT_TAGS = { karaoke: "卡拉OK點唱機", tarot: "靈性角落", sofa: "長輩沙發區", table: "辦桌圓桌", tea: "茶水吧台", mahjong: "麻將桌", candle: "燭光餐桌", buffet: "自助餐台", dj: "DJ 台", arch: "乾燥花拱門", photo: "拍照打卡花牆" };

const CATCH_RATE = { mild: 0.35, medium: 0.55, severe: 0.75, fatal: 0.95 };
const MINE_GAIN = { mild: 200, medium: 300, severe: 450, fatal: 600 };   // 沒被抓：長輩加分

/* 回嗆卡：全部帶刺，差異是路線與笑點（不再有溫和／嚴重分級，內部數值保留） */
const COMEBACK_CARDS = [
  { id: "c6", name: "回馬槍卡", line: "「阿姨紅包先收好，等你兒子結婚我再包回去」", effect: "長輩當場語塞", gain: 300, dmg: 0,   risk: 0 },
  { id: "c2", name: "商業互吹卡", line: "「叔叔你這領帶好好看！跟你上次講的股票一樣紅欸」", effect: "長輩分不清是誇是損", gain: 300, dmg: 0,   risk: 0 },
  { id: "c3", name: "陰陽卡", line: "「對啊好煩喔～阿姨你婆婆當年也這樣一直唸你嗎？」", effect: "長輩陷入回憶，攻擊中斷", gain: 350, dmg: 0,   risk: 0 },
  { id: "c4", name: "已讀卡", line: "「哇～（當面拿出手機滑）阿姨你剛剛有說話嗎？」", effect: "當面已讀，傷害性不大侮辱性極強", gain: 350, dmg: 0,   risk: 0.1 },
  { id: "c1", name: "反彈卡", line: "「那阿姨你當年幾歲生的？」", effect: "長輩沉默 3 秒", gain: 450, dmg: 100, risk: 0.15 },
  { id: "c5", name: "你兒子卡", line: "「阿姨那你兒子呢？40 了還沒對象？」", effect: "長輩直接暴斃，全場歡呼", gain: 600, dmg: 200, risk: 0.3 },
];

/* 年輕人社畜話術（表面客氣、實際在陰人） */
const SCHMOOZE = [
  { id: "s1", name: "笑面虎", line: "阿姨你看起來好年輕喔～有什麼保養秘訣？", sub: "翻譯：讓她講不停，浪費她的時間", ok: "開始分享保養品心得，15 秒內無法發動攻擊" },
  { id: "s2", name: "借刀殺人", line: "阿姨，那邊那位叔叔一直在看你欸", sub: "翻譯：把她引去別的方向", ok: "整理了一下頭髮，朝那個方向走了" },
  { id: "s3", name: "反將一軍", line: "阿姨你兒子最近怎樣？聽說他公司在裁員？", sub: "翻譯：直接戳痛點", ok: "當場沉默。長輩分數 −200", dmg: 200 },
  { id: "s4", name: "溫柔陷阱", line: "阿姨要不要喝杯氣泡水？無酒精的～", sub: "翻譯：她會以為是酒，開始講秘密", ok: "喝兩口就開始爆自家八卦，情報 GET" },
  { id: "s5", name: "假裝示弱", line: "唉，阿姨說的對，我也不知道自己在幹嘛…", sub: "翻譯：讓她切換成安慰模式", ok: "切換為慈祥模式，摸摸你的頭" },
  { id: "s6", name: "職場必殺", line: "這個建議很好，我先記下來，回頭跟主管對焦一下時程～", sub: "翻譯：用職場術語把她繞暈", ok: "頭上冒出「？？？」原地轉圈" },
  { id: "s7", name: "靈性攻擊", line: "阿姨，我感覺你的脈輪有點堵塞耶", sub: "翻譯：用身心靈話術暗示她管太多", ok: "開始懷疑自己，攻擊力 −40%" },
  { id: "s8", name: "宇宙大法", line: "宇宙的安排自有道理，我們要學會臣服～", sub: "翻譯：封住所有追問的可能", ok: "完全接不了話，沉默 8 秒" },
];

/* 大門陷阱（隨機輪替） */
/* 年輕人點歌歌單（DJ 台） */
/* 長輩卡拉OK 歌單（3台2國，長輩 KTV 必點） */
const KSONGS = [
  { t: "愛拚才會贏", a: "葉啟田", lang: "台", mood: "hype",  hint: "壓軸炸場" },
  { t: "歡喜就好",   a: "陳雷",   lang: "台", mood: "happy", hint: "輕鬆喜慶" },
  { t: "甜蜜蜜",     a: "鄧麗君", lang: "國", mood: "sweet", hint: "超應景" },
  { t: "月亮代表我的心", a: "鄧麗君", lang: "國", mood: "classic", hint: "經典安全牌" },
  { t: "家後",       a: "江蕙",   lang: "台", mood: "sad",   hint: "很感人，但…" },
];

const SONGS = [
  { t: "愛人錯過", a: "告五人" },
  { t: "My Jinji", a: "落日飛車" },
  { t: "海浪", a: "deca joins" },
  { t: "山海", a: "草東沒有派對" },
  { t: "根本沒有那種事", a: "持修" },
  { t: "我還年輕 我還年輕", a: "老王樂隊" },
];

const TRAPS = [
  { name: "早鳥優惠券", ok: "搶「前 10 名送禮券」上當被當場攔截", fail: "優惠券被風吹走了…" },
  { name: "假 WiFi 熱點", ok: "為了連「婚禮_5G_免費」停下來傳長輩圖，偷渡中斷被逮", fail: "長輩們都辦吃到飽，沒人上鉤" },
  { name: "養生講座傳單", ok: "被「免費健康檢查」吸引回長輩區排隊", fail: "傳單字太小，長輩們看不到" },
  { name: "孫子照片牆", ok: "在「來看看你孫子」展板前駐足，偷渡計畫忘光光", fail: "有長輩嫌這孫子沒自家的可愛，無效" },
];

const QUIZ = [
  { q: "請問 IG 限動怎麼發？", options: ["首頁往右滑點相機", "打電話給孫子幫忙", "用 LINE 轉傳給大家", "印出來貼在牆上"], ans: 0 },
  { q: "Dcard 是什麼？", options: ["匿名社群論壇", "一種信用卡", "撲克牌的牌組", "名片的英文"], ans: 0 },
  { q: "OOTD 是什麼意思？", options: ["今日穿搭", "一種感冒藥", "物聯網設備", "哦哦聽到了"], ans: 0 },
  { q: "請選出比周杰倫晚出道的歌手", options: ["告五人", "鄧麗君", "費玉清", "鳳飛飛"], ans: 0 },
  { q: "「已讀不回」代表什麼？", options: ["看了但不想回", "手機壞掉了", "書已經讀完了", "已經回到家了"], ans: 0 },
  { q: "年輕人說的「破防」是指？", options: ["心理防線被擊穿", "防盜門壞了", "防曬乳沒擦", "雨傘開花了"], ans: 0 },
  { q: "YouTuber 主要靠什麼賺錢？", options: ["流量和業配", "里長發薪水", "賣 VCD", "捐香油錢"], ans: 0 },
  { q: "年輕人說「我好 emo」是指？", options: ["情緒低落", "在寫電子郵件", "韓國天團粉絲", "想吃一種泡麵"], ans: 0 },
  { q: "「斜槓青年」的意思是？", options: ["有多重職業身分", "走路歪歪的年輕人", "額頭有疤", "很愛畫斜線"], ans: 0 },
  { q: "手搖飲說「微糖微冰」是？", options: ["少糖少冰", "加倍糖加倍冰", "免費升級大杯", "店員的綽號"], ans: 0 },
  { q: "「tag 我一下」是什麼意思？", options: ["在貼文標註我", "幫我買行李吊牌", "跟我玩鬼抓人", "幫我蓋章"], ans: 0 },
  { q: "Netflix 是什麼？", options: ["線上影音平台", "新型感冒藥", "住美國的親戚", "網路花店"], ans: 0 },
  { q: "限動的「24 小時後消失」代表？", options: ["貼文自動下架", "手機會自爆", "記憶體被清空", "孫子會被罵"], ans: 0 },
  { q: "年輕人說「我笑到骨頭都沒了」是指？", options: ["非常好笑", "得了骨質疏鬆", "在做瑜珈", "跌倒受傷"], ans: 0 },
];

const OUTFITS = [
  { label: "大花襯衫＋草帽", ok: false },
  { label: "西裝＋老花眼鏡", ok: false },
  { label: "寬鬆帽T＋老帽＋小白鞋", ok: true },
  { label: "旗袍＋珍珠項鍊", ok: false },
  { label: "oversize 帽T＋側背小包", ok: true },
  { label: "鴨舌帽反戴＋無線耳機", ok: true },
  { label: "polo 衫紮進西裝褲＋皮帶手機套", ok: false },
  { label: "登山外套＋遮陽斗笠", ok: false },
];

const AI_YOUTH_EVENTS = ["年輕人陣營成功攔截一位偽裝長輩！", "拍照打卡區大排長龍，潮度上升", "DJ 把音量轉大，成功蓋掉勸酒聲"];
const AI_ELDER_EVENTS = ["有長輩偷偷講完一句地雷話沒被發現…", "有長輩用紅包收買了守門人！", "邊界警報！有不明人士試圖翻越柵欄！"];

const GAME_SECONDS = 90;
const START_WALLET = 5000;

/*  現場火爆指數：全場共同進度（0–100），雙方成功行動都往上推 */
const CHAOS = {
  gate: 5,        // 成功通過柵欄
  mine: 8,        // 長輩完成一次地雷話
  comeback: 8,    // 年輕人完成一次毒舌回擊
  verify: 6,      // 成功辨認偽裝
  carry: 5,       // 成功把長輩架回
  shout: 10,      // 使用大聲公
  chain: 3,       // 特殊連鎖（交鋒）
};
const CHAOS_STAGES = [
  { min: 80, label: "全場大亂鬥", color: "#F2B234" },
  { min: 50, label: "火爆", color: "#E5304C" },
  { min: 25, label: "熱絡", color: "#E08A3C" },
  { min: 0,  label: "尷尬期", color: "#D8D2C4" },
];
const chaosStage = (v) => CHAOS_STAGES.find((s) => v >= s.min);
const SHOUT_LIMIT = 2; // 大聲公每場每人限用次數

const rand = (a) => a[Math.floor(Math.random() * a.length)];
const sample = (a, n) => [...a].sort(() => Math.random() - 0.5).slice(0, n);
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/* ============================================================
    角色視覺資料（醜萌手繪風 SVG）
   ============================================================ */

const INK = "#1d1a17";


const VIS = {
  e1: { skin: "#D98E73", lip: "#C8102E", eyes: "fierce", blush: true, wrinkle: true,
        hairColor: "#5A3A28" }, // 陳英珠：燙捲頭、金項鍊、大花洋裝
  e2: { skin: "#B5B08A", lip: "#9C4A3C", eyes: "half", wrinkle: true,
        hairColor: "#9A9A96" }, // 林水泉：地中海、老花眼鏡、polo+高腰皮帶、茶杯
  e3: { skin: "#E8B4A0", lip: "#A8324A", eyes: "smug", blush: true, wrinkle: true,
        hairColor: "#8E4A33" }, // 王秀蘭：紅棕短髮、玉鐲、旗袍、嘴角上揚
  e4: { skin: "#D96B4A", lip: "#7E2A2A", eyes: "drunk", blush: true, wrinkle: true,
        hairColor: "#E8E4DC" }, // 張金發：白油頭、紅臉、短袖襯衫塞褲子、酒杯
  y1: { skin: "#F2D8C9", lip: "#C97A7A", eyes: "shy",
        hairColor: "#241F1C" }, // 小玲：長直髮、無框眼鏡、白洋裝、社恐
  y2: { skin: "#E8C49C", lip: "#B06A55", eyes: "round",
        hairColor: "#2B241F" }, // 阿凱：逗號瀏海、西裝外套+運動鞋
  y3: { skin: "#EFC9B8", lip: "#B03A5C", eyes: "sharp",
        hairColor: "#241F22" }, // Mia：短髮挑染、黑套裝、自信
  y4: { skin: "#E5A87A", lip: "#A8654A", eyes: "round", blush: true,
        hairColor: "#3A2E24" }, // DJ 小胖：反戴棒球帽、oversize 帽T、大耳機
  guard: { skin: "#C99A7A", lip: "#7A5040", eyes: "none",
        hairColor: "#1d1a17" },
};

/* ---- 角色 SVG 元件 ---- */
function CharSprite({ id, w = 90, expression = "idle", headOnly = false, disguise = false }) {
  const v = VIS[id] || VIS.guard;
  const H = headOnly ? 108 : 184;
  const shock = expression === "shock";
  const dead = expression === "dead";
  const s = { stroke: INK, strokeWidth: 4, strokeLinecap: "round", strokeLinejoin: "round" };

  /* --- 眼睛 --- */
  const Eye = ({ x }) => {
    const t = v.eyes;
    if (dead) return <g {...s}><line x1={x - 7} y1={50} x2={x + 7} y2={62} /><line x1={x + 7} y1={50} x2={x - 7} y2={62} /></g>;
    if (shock) return <g><circle cx={x} cy={56} r={9} fill="#fff" {...s} /><circle cx={x} cy={56} r={2.6} fill={INK} /></g>;
    if (t === "fierce") return <g><circle cx={x} cy={56} r={8} fill="#fff" {...s} /><circle cx={x + 1.5} cy={57} r={3.2} fill={INK} /><path d={`M ${x - 10} 44 L ${x + 9} 49`} fill="none" {...s} strokeWidth={5} /></g>;
    if (t === "half") return <g><path d={`M ${x - 9} 56 Q ${x} 49 ${x + 9} 56`} fill="#fff" {...s} /><path d={`M ${x - 9} 56 Q ${x} 60 ${x + 9} 56`} fill="none" {...s} /><circle cx={x} cy={56.5} r={2.4} fill={INK} /></g>;
    if (t === "smug") return <g><path d={`M ${x - 9} 57 Q ${x} 47 ${x + 9} 57`} fill="none" {...s} strokeWidth={4.5} /></g>;
    if (t === "drunk") return <g><circle cx={x} cy={56} r={7.5} fill="#fff" {...s} /><circle cx={x - 1} cy={58} r={2.8} fill={INK} /><path d={`M ${x - 9} 46 Q ${x} 42 ${x + 9} 47`} fill="none" {...s} /></g>;
    if (t === "shy") return <g><circle cx={x} cy={56} r={6.5} fill="#fff" {...s} strokeWidth={3.5} /><circle cx={x} cy={57.5} r={2.2} fill={INK} /></g>;
    if (t === "sharp") return <g><path d={`M ${x - 9} 53 L ${x + 9} 55 L ${x + 8} 60 L ${x - 8} 59 Z`} fill="#fff" {...s} /><circle cx={x + 2} cy={56.5} r={2.4} fill={INK} /><path d={`M ${x - 11} 46 L ${x + 9} 50`} fill="none" {...s} strokeWidth={4.5} /></g>;
    if (t === "none") return null;
    return <g><circle cx={x} cy={56} r={7.5} fill="#fff" {...s} /><circle cx={x} cy={56.5} r={2.6} fill={INK} /></g>;
  };

  /* --- 嘴巴（大厚唇 + 直紋，參考醜萌風） --- */
  const Mouth = () => {
    if (shock) return <g><ellipse cx={65} cy={84} rx={13} ry={11} fill="#5A1212" {...s} /><path d="M 56 90 Q 65 96 74 90" fill="#E06A6A" stroke="none" /></g>;
    if (dead) return <path d="M 54 84 Q 65 78 76 84" fill="none" {...s} />;
    const w2 = v.eyes === "smug" ? "M 50 80 Q 65 90 80 76" : null;
    return (
      <g>
        <ellipse cx={65} cy={83} rx={15} ry={8.5} fill={v.lip} {...s} />
        <line x1={50} y1={83} x2={80} y2={83} {...s} strokeWidth={3} />
        {[57, 63, 69, 75].map((x) => <line key={x} x1={x} y1={77.5} x2={x} y2={88.5} stroke={INK} strokeWidth={2} opacity={0.55} />)}
        {w2 && <path d={w2} fill="none" stroke={INK} strokeWidth={0} />}
      </g>
    );
  };

  /* --- 髮型 --- */
  const Hair = () => {
    const hc = v.hairColor;
    switch (id) {
      case "e1": // 燙捲頭
        return <g {...s} fill={hc}>{[[28,38],[36,24],[50,15],[65,11],[80,15],[94,24],[102,38],[24,52],[106,52]].map(([cx,cy],i)=>(<circle key={i} cx={cx} cy={cy} r={11} />))}</g>;
      case "e2": // 地中海禿頭
        return <g {...s} fill={hc}>
          <path d="M 22 56 Q 20 42 28 38 Q 32 50 30 62 Z" />
          <path d="M 108 56 Q 110 42 102 38 Q 98 50 100 62 Z" />
          <path d="M 50 16 Q 56 12 58 18" fill="none" /><path d="M 66 13 Q 72 10 73 16" fill="none" /><path d="M 80 16 Q 86 14 86 20" fill="none" />
        </g>;
      case "e3": // 紅棕短髮 bob
        return <g {...s} fill={hc}><path d="M 23 64 Q 16 20 65 13 Q 114 20 107 64 Q 104 50 96 44 Q 92 28 65 26 Q 38 28 34 44 Q 26 50 23 64 Z" /></g>;
      case "e4": // 白色油頭
        return <g {...s} fill={hc}>
          <path d="M 26 46 Q 26 16 65 14 Q 104 16 104 46 Q 100 32 65 30 Q 30 32 26 46 Z" />
          <path d="M 38 24 Q 58 17 84 21" fill="none" strokeWidth={2.5} /><path d="M 42 30 Q 62 24 90 27" fill="none" strokeWidth={2.5} />
        </g>;
      case "y1": // 長直髮
        return <g {...s} fill={hc}>
          <path d="M 22 50 Q 20 14 65 12 Q 110 14 108 50 L 110 108 Q 104 114 98 108 L 96 60 Q 92 40 65 38 Q 38 40 34 60 L 32 108 Q 26 114 20 108 Z" />
          <path d="M 36 40 Q 65 30 94 40 L 94 34 Q 65 24 36 34 Z" />
        </g>;
      case "y2": // 韓系逗號瀏海
        return <g {...s} fill={hc}>
          <path d="M 24 52 Q 22 16 65 13 Q 108 16 106 52 Q 102 36 90 32 Q 92 44 84 48 Q 86 34 65 30 Q 44 34 46 48 Q 38 44 40 32 Q 28 36 24 52 Z" />
        </g>;
      case "y3": // 短髮挑染
        return <g {...s}>
          <path d="M 23 58 Q 18 16 65 12 Q 112 16 107 58 Q 100 40 88 36 Q 78 30 52 32 Q 32 36 23 58 Z" fill={hc} />
          <path d="M 78 18 Q 96 22 100 42 Q 92 34 80 31 Z" fill="#E86AA0" />
        </g>;
      case "y4": // 反戴棒球帽
        return <g {...s}>
          <path d="M 26 46 Q 28 14 65 12 Q 102 14 104 46 Q 84 38 65 38 Q 46 38 26 46 Z" fill="#C8332A" />
          <path d="M 96 28 L 118 24 Q 122 34 112 38 L 98 40 Z" fill="#A8261F" />
          <circle cx={62} cy={22} r={3.5} fill="#fff" stroke="none" />
          <path d="M 26 50 Q 30 44 36 48" fill={hc} /><path d="M 94 48 Q 100 44 104 50" fill={hc} />
        </g>;
      case "guard":
        return <g {...s} fill={hc}><path d="M 26 44 Q 28 16 65 14 Q 102 16 104 44 Q 84 34 65 34 Q 46 34 26 44 Z" /></g>;
      default:
        return null;
    }
  };

  /* --- 配件 --- */
  const Extras = () => (
    <g>
      {id === "e2" && <g {...s}>{/* 老花眼鏡（低掛） */}
        <circle cx={47} cy={62} r={11} fill="rgba(255,255,255,.55)" strokeWidth={3} />
        <circle cx={83} cy={62} r={11} fill="rgba(255,255,255,.55)" strokeWidth={3} />
        <line x1={58} y1={62} x2={72} y2={62} strokeWidth={3} />
      </g>}
      {id === "y1" && <g stroke="#9AA6B5" strokeWidth={2} fill="rgba(255,255,255,.35)">
        <circle cx={47} cy={57} r={10} /><circle cx={83} cy={57} r={10} /><line x1={57} y1={57} x2={73} y2={57} />
      </g>}
      {id === "guard" && <g {...s}>
        <rect x={36} y={48} width={24} height={13} rx={5} fill={INK} />
        <rect x={70} y={48} width={24} height={13} rx={5} fill={INK} />
        <line x1={60} y1={53} x2={70} y2={53} />
      </g>}
      {id === "y4" && <g {...s}>{/* 大耳機 */}
        <path d="M 22 50 Q 18 18 65 14 Q 112 18 108 50" fill="none" strokeWidth={6} />
        <rect x={14} y={46} width={14} height={22} rx={6} fill="#3A3A40" />
        <rect x={102} y={46} width={14} height={22} rx={6} fill="#3A3A40" />
      </g>}
      {disguise && <g {...s}>
        <path d="M 26 40 Q 28 12 65 10 Q 102 12 104 40 Q 84 32 65 32 Q 46 32 26 40 Z" fill="#3A6EA5" />
        <path d="M 30 38 L 8 44 Q 6 52 16 52 L 32 46 Z" fill="#2C5580" />
      </g>}
      {v.blush && !shock && <g fill="#E06A6A" opacity={0.6} stroke="none"><ellipse cx={38} cy={70} rx={6} ry={4} /><ellipse cx={92} cy={70} rx={6} ry={4} /></g>}
      {v.wrinkle && <g stroke={INK} strokeWidth={2} fill="none" opacity={0.5}>
        <path d="M 50 36 Q 65 32 80 36" /><path d="M 40 73 Q 36 78 39 82" /><path d="M 90 73 Q 94 78 91 82" />
      </g>}
    </g>
  );

  /* --- 身體（小小的，頭身比 1:1） --- */
  const Body = () => {
    const armL = (fill) => <path d="M 40 116 Q 26 124 28 140" fill="none" stroke={fill} strokeWidth={11} strokeLinecap="round" />;
    const armR = (fill) => <path d="M 90 116 Q 104 124 102 140" fill="none" stroke={fill} strokeWidth={11} strokeLinecap="round" />;
    const armOutline = <g stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round"><path d="M 40 116 Q 24 124 26 142" /><path d="M 90 116 Q 106 124 104 142" /></g>;
    const legs = (pants, shoes) => <g {...s}>
      <rect x={50} y={158} width={11} height={16} rx={4} fill={pants} />
      <rect x={69} y={158} width={11} height={16} rx={4} fill={pants} />
      <ellipse cx={54} cy={177} rx={9} ry={5} fill={shoes} />
      <ellipse cx={76} cy={177} rx={9} ry={5} fill={shoes} />
    </g>;
    switch (id) {
      case "e1": // 大花洋裝
        return <g>
          {armL("#E0702E")}{armR("#E0702E")}{armOutline}
          <path d="M 44 110 L 86 110 Q 96 134 92 162 L 38 162 Q 34 134 44 110 Z" fill="#E0702E" {...s} />
          {[[52,126],[70,134],[60,150],[80,120],[46,146]].map(([x,y],i)=>(<g key={i} stroke="none"><circle cx={x} cy={y} r={5.5} fill="#E86AA0" /><circle cx={x} cy={y} r={2} fill="#FFE6A0" /></g>))}
          <path d="M 52 110 Q 65 120 78 110" fill="none" stroke="#E8B84B" strokeWidth={4} />
          <circle cx={65} cy={118} r={3} fill="#E8B84B" stroke={INK} strokeWidth={2} />
          {legs(v.skin, "#8E4A33")}
        </g>;
      case "e2": // polo + 高腰皮帶 + 茶杯
        return <g>
          {armL("#3E7C6E")}{armR("#3E7C6E")}{armOutline}
          <path d="M 44 110 L 86 110 Q 92 128 90 158 L 40 158 Q 38 128 44 110 Z" fill="#3E7C6E" {...s} />
          <path d="M 57 110 L 65 122 L 73 110" fill="#fff" {...s} strokeWidth={3} />
          <rect x={40} y={128} width={50} height={9} fill="#6E4A2E" {...s} strokeWidth={3} />
          <rect x={61} y={128} width={9} height={9} fill="#E8B84B" stroke={INK} strokeWidth={2.5} />
          <g {...s}><ellipse cx={104} cy={140} rx={9} ry={7} fill="#fff" /><path d="M 112 138 q 7 2 0 7" fill="none" strokeWidth={3} /><path d="M 99 132 q 2 -5 4 0 M 105 131 q 2 -5 4 0" stroke="#aaa" strokeWidth={2} fill="none" /></g>
          {legs("#7A6A55", "#4A3A2A")}
        </g>;
      case "e3": // 旗袍
        return <g>
          {armL("#7A3A8E")}{armR("#7A3A8E")}{armOutline}
          <path d="M 46 110 L 84 110 Q 92 134 88 164 L 42 164 Q 38 134 46 110 Z" fill="#7A3A8E" {...s} />
          <path d="M 65 110 Q 84 116 84 132" fill="none" stroke="#E8B84B" strokeWidth={3} />
          {[ [74,116],[80,126] ].map(([x,y],i)=>(<circle key={i} cx={x} cy={y} r={2.6} fill="#E8B84B" stroke={INK} strokeWidth={2} />))}
          <circle cx={102} cy={134} r={6} fill="none" stroke="#3E8E5A" strokeWidth={5} />
          {legs(v.skin, "#C8102E")}
        </g>;
      case "e4": // 短袖襯衫塞褲子 + 酒杯
        return <g>
          {armL("#A8C8DC")}{armR("#A8C8DC")}{armOutline}
          <path d="M 44 110 L 86 110 Q 92 124 90 140 L 40 140 Q 38 124 44 110 Z" fill="#A8C8DC" {...s} />
          <line x1={65} y1={112} x2={65} y2={138} stroke={INK} strokeWidth={2.5} />
          <path d="M 40 140 L 90 140 L 88 162 L 42 162 Z" fill="#4A4A55" {...s} />
          <rect x={40} y={137} width={50} height={7} fill="#2E2E36" {...s} strokeWidth={3} />
          <g {...s}><path d="M 98 128 q 8 0 8 8 q 0 8 -8 8 q -8 0 -8 -8 q 0 -8 8 -8" fill="#F2D8C9" opacity={0} /><path d="M 96 126 L 110 126 L 106 138 L 100 138 Z" fill="#E8B0B8" /><line x1={103} y1={138} x2={103} y2={148} strokeWidth={3} /><line x1={97} y1={149} x2={109} y2={149} strokeWidth={3} /></g>
          {legs("#4A4A55", "#2A2A30")}
        </g>;
      case "y1": // 白洋裝
        return <g>
          {armL("#FBF6EC")}{armR("#FBF6EC")}{armOutline}
          <path d="M 46 110 L 84 110 Q 94 136 90 164 L 40 164 Q 36 136 46 110 Z" fill="#FBF6EC" {...s} />
          <path d="M 46 134 Q 65 140 84 134" fill="none" stroke="#D9C8B0" strokeWidth={2.5} />
          {legs(v.skin, "#E8E0D2")}
        </g>;
      case "y2": // 西裝外套 + 運動鞋
        return <g>
          {armL("#2E3A5C")}{armR("#2E3A5C")}{armOutline}
          <path d="M 44 110 L 86 110 Q 92 130 90 160 L 40 160 Q 38 130 44 110 Z" fill="#2E3A5C" {...s} />
          <path d="M 56 110 L 65 126 L 74 110" fill="#fff" {...s} strokeWidth={3} />
          <line x1={65} y1={126} x2={65} y2={158} stroke={INK} strokeWidth={2.5} />
          {legs("#5C5248", "#fff")}
        </g>;
      case "y3": // 黑套裝
        return <g>
          {armL("#26222A")}{armR("#26222A")}{armOutline}
          <path d="M 44 110 L 86 110 Q 92 130 90 160 L 40 160 Q 38 130 44 110 Z" fill="#26222A" {...s} />
          <path d="M 57 110 L 65 124 L 73 110" fill="#E86AA0" {...s} strokeWidth={3} />
          {legs("#26222A", "#E86AA0")}
        </g>;
      case "y4": // oversize 帽T
        return <g>
          {armL("#D9A435")}{armR("#D9A435")}{armOutline}
          <path d="M 38 110 L 92 110 Q 100 134 96 164 L 34 164 Q 30 134 38 110 Z" fill="#D9A435" {...s} />
          <path d="M 50 110 Q 65 122 80 110" fill="none" {...s} strokeWidth={3} />
          <line x1={58} y1={124} x2={56} y2={136} stroke={INK} strokeWidth={3} /><line x1={72} y1={124} x2={74} y2={136} stroke={INK} strokeWidth={3} />
          {legs("#3A3A40", "#fff")}
        </g>;
      case "guard":
        return <g>
          <path d="M 36 108 L 94 108 Q 102 134 98 166 L 32 166 Q 28 134 36 108 Z" fill="#1d1a17" {...s} />
          <path d="M 58 108 L 65 120 L 72 108" fill="#fff" {...s} strokeWidth={3} />
          <path d="M 44 128 Q 65 116 86 128" fill="none" stroke="#555" strokeWidth={9} strokeLinecap="round" />
          <path d="M 86 60 Q 96 80 90 108" fill="none" stroke="#ddd" strokeWidth={2.5} />
          {legs("#1d1a17", "#111")}
        </g>;
      default: return null;
    }
  };

  return (
    <svg width={w} height={(w * H) / 130} viewBox={`0 0 130 ${H}`} style={{ overflow: "visible", display: "block" }}>
      {!headOnly && <Body />}
      {/* 臉 */}
      <path d="M 24 60 Q 21 20 65 16 Q 109 20 106 60 Q 105 96 65 101 Q 25 96 24 60 Z" fill={v.skin} {...s} />
      <Hair />
      <Eye x={47} /><Eye x={83} />
      <path d="M 62 66 Q 67 70 63 73" fill="none" {...s} strokeWidth={3} />
      <Mouth />
      <Extras />
      {id === "e1" && !headOnly && <g stroke={INK} strokeWidth={2.5}><path d="M 48 103 Q 65 113 82 103" fill="none" stroke="#E8B84B" strokeWidth={5} /></g>}
    </svg>
  );
}

/* ============================================================
   場景擺設（SVG 小物件）
   ============================================================ */
const Prop = ({ children, x, y, w, h, onClick, hot, label, tag, z, hintTop }) => (
  <div onClick={onClick}
    className={`${onClick ? "wb-stop" : ""} ${hot ? "wb-hot" : ""}`}
    style={{ position: "absolute", left: x, bottom: y, width: w, height: h, cursor: onClick ? "pointer" : "default", zIndex: z }}>
    {children}
    {tag && <div style={{ position: "absolute", bottom: -18, left: "50%", transform: "translateX(-50%)", background: "rgba(29,26,23,.6)", color: "#FBF6EC", fontSize: 10, fontWeight: 900, padding: "1px 7px", borderRadius: 8, whiteSpace: "nowrap", pointerEvents: "none" }}>{tag}</div>}
    {hot && label && <div className="wb-hint" style={hintTop !== undefined ? { top: hintTop } : undefined}>{label}</div>}
  </div>
);

const KaraokeProp = () => (
  <svg viewBox="0 0 120 110" width="100%" height="100%">
    <rect x={10} y={6} width={100} height={62} rx={6} fill="#1d1a17" stroke={INK} strokeWidth={4} />
    <rect x={18} y={14} width={84} height={46} rx={3} fill="#2E5C8E" />
    <text x={60} y={34} textAnchor="middle" fontSize={11} fill="#FFE6A0" fontWeight="bold">♪ 歡喜就好 ♪</text>
    <text x={60} y={50} textAnchor="middle" fontSize={9} fill="#fff">你問我愛你有多深…</text>
    <rect x={52} y={68} width={16} height={20} fill="#3A3A40" stroke={INK} strokeWidth={3} />
    <rect x={34} y={88} width={52} height={10} rx={4} fill="#5A4A3A" stroke={INK} strokeWidth={3} />
    <circle cx={20} cy={96} r={9} fill="#1d1a17" /><rect x={17} y={84} width={6} height={14} fill="#888" />
  </svg>
);
const MahjongProp = () => (
  <svg viewBox="0 0 110 80" width="100%" height="100%">
    <rect x={10} y={26} width={90} height={40} rx={8} fill="#2E7C4F" stroke={INK} strokeWidth={4} />
    <rect x={20} y={66} width={8} height={12} fill="#6E4A2E" stroke={INK} strokeWidth={3} />
    <rect x={82} y={66} width={8} height={12} fill="#6E4A2E" stroke={INK} strokeWidth={3} />
    {[[26,32],[40,30],[54,34],[68,30],[80,33]].map(([x,y],i)=>(<rect key={i} x={x} y={y} width={11} height={15} rx={2} fill="#FBF6EC" stroke={INK} strokeWidth={2.5} />))}
    <text x={31} y={44} fontSize={9} fill="#C8102E" fontWeight="bold">中</text>
    <text x={59} y={47} fontSize={9} fill="#2E7C4F" fontWeight="bold">發</text>
  </svg>
);
const TeaProp = () => (
  <svg viewBox="0 0 100 90" width="100%" height="100%">
    <rect x={8} y={48} width={84} height={34} rx={5} fill="#8E5A33" stroke={INK} strokeWidth={4} />
    <path d="M 30 24 q 16 -14 32 0 l 4 22 l -40 0 Z" fill="#C8413A" stroke={INK} strokeWidth={4} />
    <path d="M 62 28 q 14 -2 12 12" fill="none" stroke={INK} strokeWidth={5} />
    <rect x={42} y={14} width={8} height={8} fill="#C8413A" stroke={INK} strokeWidth={3} />
    <ellipse cx={24} cy={46} rx={8} ry={5} fill="#fff" stroke={INK} strokeWidth={3} />
  </svg>
);
const SofaProp = () => (
  <svg viewBox="0 0 130 80" width="100%" height="100%">
    <path d="M 12 30 q 0 -14 14 -14 l 78 0 q 14 0 14 14 l 0 34 l -106 0 Z" fill="#7A4A2E" stroke={INK} strokeWidth={4} />
    <rect x={22} y={34} width={40} height={22} rx={6} fill="#9C6A45" stroke={INK} strokeWidth={3} />
    <rect x={68} y={34} width={40} height={22} rx={6} fill="#9C6A45" stroke={INK} strokeWidth={3} />
    <rect x={6} y={28} width={14} height={38} rx={6} fill="#5C3A24" stroke={INK} strokeWidth={3.5} />
    <rect x={110} y={28} width={14} height={38} rx={6} fill="#5C3A24" stroke={INK} strokeWidth={3.5} />
  </svg>
);
const RoundTableProp = () => (
  <svg viewBox="0 0 110 80" width="100%" height="100%">
    <ellipse cx={55} cy={36} rx={48} ry={18} fill="#C8102E" stroke={INK} strokeWidth={4} />
    <rect x={48} y={50} width={14} height={22} fill="#8E2424" stroke={INK} strokeWidth={3} />
    <ellipse cx={55} cy={32} rx={20} ry={7} fill="#E8B84B" opacity={0.9} />
    <circle cx={42} cy={33} r={4} fill="#fff" stroke={INK} strokeWidth={2} />
    <circle cx={66} cy={36} r={4} fill="#fff" stroke={INK} strokeWidth={2} />
  </svg>
);
const BuffetProp = () => (
  <svg viewBox="0 0 130 80" width="100%" height="100%">
    <rect x={8} y={38} width={114} height={12} fill="#fff" stroke={INK} strokeWidth={4} />
    <rect x={12} y={50} width={106} height={24} fill="#E8E0D2" stroke={INK} strokeWidth={3.5} />
    {[[26,32],[56,30],[88,32]].map(([x,y],i)=>(<g key={i}><ellipse cx={x} cy={y+6} rx={14} ry={5} fill="#D9D2C2" stroke={INK} strokeWidth={2.5} /><path d={`M ${x-10} ${y+4} q 10 -12 20 0`} fill={["#E8A43A","#C85A3A","#8EB05A"][i]} stroke={INK} strokeWidth={2.5} /></g>))}
    <text x={65} y={66} textAnchor="middle" fontSize={10} fontWeight="bold" fill="#7A5C44">BUFFET</text>
  </svg>
);
const DJProp = () => (
  <svg viewBox="0 0 120 90" width="100%" height="100%">
    <rect x={14} y={44} width={92} height={36} rx={4} fill="#3A3A45" stroke={INK} strokeWidth={4} />
    <circle cx={42} cy={58} r={11} fill="#1d1a17" stroke="#888" strokeWidth={3} /><circle cx={42} cy={58} r={3} fill="#E8B84B" />
    <circle cx={78} cy={58} r={11} fill="#1d1a17" stroke="#888" strokeWidth={3} /><circle cx={78} cy={58} r={3} fill="#E8B84B" />
    <rect x={56} y={52} width={8} height={14} fill="#666" stroke={INK} strokeWidth={2} />
    <path d="M 20 40 L 30 18 M 60 40 L 60 14 M 100 40 L 90 18" stroke="#E86AA0" strokeWidth={4} strokeLinecap="round" opacity={0.8} />
    <circle cx={30} cy={16} r={4} fill="#E86AA0" /><circle cx={60} cy={12} r={4} fill="#8EE0C0" /><circle cx={90} cy={16} r={4} fill="#E8B84B" />
  </svg>
);
const ArchProp = () => (
  <svg viewBox="0 0 110 130" width="100%" height="100%">
    <path d="M 18 126 L 18 50 Q 18 14 55 14 Q 92 14 92 50 L 92 126" fill="none" stroke="#C9B89A" strokeWidth={9} />
    <path d="M 18 126 L 18 50 Q 18 14 55 14 Q 92 14 92 50 L 92 126" fill="none" stroke={INK} strokeWidth={2} opacity={.4} />
    {[[18,60],[16,90],[24,36],[55,14],[86,36],[92,60],[94,90]].map(([x,y],i)=>(<g key={i}><circle cx={x} cy={y} r={7} fill={["#fff","#F2C9D0","#FFE6A0"][i%3]} stroke={INK} strokeWidth={2.5} /><circle cx={x+6} cy={y+4} r={4.5} fill="#8EB05A" stroke={INK} strokeWidth={2} /></g>))}
    <path d="M 30 26 Q 55 44 80 26" fill="none" stroke="#fff" strokeWidth={7} opacity={.9} />
  </svg>
);
const TarotProp = () => (
  <svg viewBox="0 0 96 86" width="100%" height="100%">
    <ellipse cx={48} cy={62} rx={40} ry={14} fill="#6E4A8E" stroke={INK} strokeWidth={3.5} />
    <rect x={42} y={62} width={12} height={20} fill="#4A3060" stroke={INK} strokeWidth={3} />
    <circle cx={30} cy={46} r={13} fill="#CBB7E8" stroke={INK} strokeWidth={3} />
    <circle cx={26} cy={42} r={4} fill="#fff" opacity={.8} />
    <rect x={22} y={57} width={16} height={6} rx={2} fill="#4A3060" stroke={INK} strokeWidth={2.5} />
    {[-18, 0, 18].map((a, i) => (
      <rect key={i} x={56} y={38} width={15} height={23} rx={2.5} fill={i === 1 ? "#FFE6A0" : "#E8DFF5"} stroke={INK} strokeWidth={2.5} transform={`rotate(${a} 63 60)`} />
    ))}
    <text x={63} y={54} textAnchor="middle" fontSize={9} fontWeight={900} fill={INK}></text>
    {[0, 1, 2].map((i) => (
      <circle key={"s" + i} cx={84 - i * 3} cy={36 - i * 10} r={3.5 - i * 0.8} fill="#BFC9BF" opacity={.7} style={{ animation: `wbIdle ${1.6 + i * 0.5}s ease-in-out infinite` }} />
    ))}
    <rect x={80} y={42} width={9} height={5} rx={2} fill="#7A6A55" stroke={INK} strokeWidth={2} />
  </svg>
);

const PhotoProp = () => (
  <svg viewBox="0 0 130 132" width="100%" height="100%">
    <rect x={22} y={104} width={10} height={26} fill="#9C8A6E" stroke={INK} strokeWidth={3} />
    <rect x={98} y={104} width={10} height={26} fill="#9C8A6E" stroke={INK} strokeWidth={3} />
    <rect x={10} y={14} width={110} height={94} rx={8} fill="#F7EFE6" stroke={INK} strokeWidth={4} />
    {[[32,42,-30],[60,32,20],[90,46,-15],[42,74,30],[74,64,-25],[98,84,15],[28,92,-20],[60,94,25]].map(([x,y,a],i)=>(
      <ellipse key={"lf"+i} cx={x} cy={y} rx={9} ry={4.5} fill="#7FAF6A" stroke={INK} strokeWidth={2} transform={`rotate(${a} ${x} ${y})`} />
    ))}
    {[[36,36,"#E86AA0"],[66,28,"#fff"],[96,40,"#FFE6A0"],[28,66,"#fff"],[60,58,"#E86AA0"],[92,68,"#F2C9D0"],[42,92,"#FFE6A0"],[76,90,"#fff"],[106,94,"#E86AA0"]].map(([x,y,c],i)=>(
      <g key={"fl"+i}>
        {[0,60,120,180,240,300].map((a)=>(<circle key={a} cx={x+Math.cos(a*Math.PI/180)*7} cy={y+Math.sin(a*Math.PI/180)*7} r={5} fill={c} stroke={INK} strokeWidth={2} />))}
        <circle cx={x} cy={y} r={4.5} fill="#E8B84B" stroke={INK} strokeWidth={2} />
      </g>
    ))}
    <path d="M 18 18 Q 65 34 112 18" fill="none" stroke="#7FAF6A" strokeWidth={5} />
    {[[30,22],[50,26],[80,26],[100,22]].map(([x,y],i)=>(
      <circle key={"li"+i} cx={x} cy={y} r={3.5} fill="#FFE6A0" stroke={INK} strokeWidth={1.5} style={{ animation: `wbTwinkle ${1.2+i*0.3}s ease-in-out infinite alternate` }} />
    ))}
    <line x1={65} y1={0} x2={65} y2={10} stroke={INK} strokeWidth={2.5} />
    <rect x={49} y={8} width={32} height={24} rx={4} fill="#C8102E" stroke={INK} strokeWidth={3} />
    <text x={65} y={26} textAnchor="middle" fontSize={14} fontWeight={900} fill="#FFE6A0">囍</text>
  </svg>
);
const LanternRow = ({ n = 4 }) => (
  <div style={{ display: "flex", gap: 38, position: "absolute", top: 0, left: 30 }}>
    {Array.from({ length: n }).map((_, i) => (
      <svg key={i} width={34} height={56} viewBox="0 0 34 56" style={{ animation: `wbSway ${2.2 + i * 0.3}s ease-in-out infinite alternate`, transformOrigin: "top center" }}>
        <line x1={17} y1={0} x2={17} y2={10} stroke={INK} strokeWidth={2.5} />
        <ellipse cx={17} cy={26} rx={13} ry={16} fill="#C8102E" stroke={INK} strokeWidth={3} />
        <rect x={10} y={8} width={14} height={5} fill="#E8B84B" stroke={INK} strokeWidth={2} />
        <rect x={10} y={40} width={14} height={5} fill="#E8B84B" stroke={INK} strokeWidth={2} />
        <line x1={17} y1={45} x2={17} y2={54} stroke="#E8B84B" strokeWidth={3} />
      </svg>
    ))}
  </div>
);
const BuffetTableCandle = () => (
  <svg viewBox="0 0 130 80" width="100%" height="100%">
    <rect x={10} y={36} width={110} height={12} fill="#fff" stroke={INK} strokeWidth={4} />
    <rect x={20} y={48} width={10} height={26} fill="#C9B89A" stroke={INK} strokeWidth={3} />
    <rect x={100} y={48} width={10} height={26} fill="#C9B89A" stroke={INK} strokeWidth={3} />
    {[35, 62, 90].map((x, i) => (
      <g key={i}>
        <rect x={x - 3} y={20} width={6} height={16} fill="#FBF6EC" stroke={INK} strokeWidth={2.5} />
        <ellipse cx={x} cy={16} rx={3.5} ry={5.5} fill="#FFB347" style={{ animation: `wbTwinkle ${1 + i * 0.4}s ease-in-out infinite alternate` }} />
      </g>
    ))}
    <circle cx={48} cy={32} r={5} fill="#F2C9D0" stroke={INK} strokeWidth={2} />
    <circle cx={76} cy={32} r={5} fill="#fff" stroke={INK} strokeWidth={2} />
  </svg>
);

/* ---- 世界座標（固定常數） ---- */
const WORLD = {
  width: 2080, height: 430,
  gateX: 820,
  youthEntry: 1000,
  spots: [
    { id: "karaoke", x: 80, w: 150, h: 140, zone: "elder", label: "高歌一曲 +100", Comp: KaraokeProp },
    { id: "sofa", x: 270, w: 160, h: 95, zone: "elder", Comp: SofaProp },
    { id: "table", x: 460, w: 130, h: 95, zone: "elder", Comp: RoundTableProp },
    { id: "tea", x: 610, w: 110, h: 100, zone: "elder", Comp: TeaProp },
    { id: "mahjong", x: 440, w: 135, h: 95, zone: "elder", off: 130, Comp: MahjongProp },
    { id: "candle", x: 940, w: 150, h: 92, zone: "youth", Comp: BuffetTableCandle },
    { id: "buffet", x: 1200, w: 160, h: 95, zone: "youth", Comp: BuffetProp },
    { id: "dj", x: 1450, w: 145, h: 105, zone: "youth", Comp: DJProp },
    { id: "arch", x: 1900, w: 130, h: 150, zone: "youth", Comp: ArchProp },
    { id: "photo", x: 1672, w: 126, h: 128, zone: "youth", off: 148, Comp: PhotoProp },
    { id: "tarot", x: 1128, w: 96, h: 86, zone: "youth", off: 138, Comp: TarotProp },
  ],
};

/* ---- LED 跑馬燈：全局事件播報專用 ----
   一次只播一件事，每則至少停留 5 秒；積太多則只回補最近幾則。
   保留台灣鄉里廣播的紅字閃爍感。一般對話不進跑馬燈。 */
const Marquee = ({ led }) => {
  const [cur, setCur] = useState(led[led.length - 1] || null);
  const shownSeq = useRef(cur ? cur.seq || 0 : -1);
  const ledRef = useRef(led); ledRef.current = led;
  useEffect(() => {
    const t = setInterval(() => {
      const list = ledRef.current;
      const pending = list.filter((m) => (m.seq || 0) > shownSeq.current);
      if (!pending.length) return;
      const next = pending.length > 3 ? pending[pending.length - 3] : pending[0];
      shownSeq.current = next.seq || 0;
      setCur(next);
    }, 5000);
    return () => clearInterval(t);
  }, []);
  const big = cur && (cur.text.includes("") || cur.text.includes("【"));
  return (
    <div className="relative overflow-hidden" style={{ background: "#140202", border: `3px solid #3A0E0E`, boxShadow: "inset 0 0 14px rgba(255,60,40,.25), 0 2px 0 rgba(0,0,0,.4)", minHeight: 34 }}>
      {cur && (
        <div key={cur.seq || cur.text} className="flex items-center justify-center gap-2 px-3 py-1 font-black wb-ledin"
          style={{
            fontSize: big ? "clamp(12px, 3vw, 16px)" : "clamp(11px, 2.6vw, 14px)",
            color: big ? "#FFD24A" : "#FF6A55",
            textShadow: big ? "0 0 9px rgba(255,210,74,.95), 0 0 2px #000" : "0 0 8px rgba(255,106,85,.9), 0 0 2px #000",
            letterSpacing: ".04em", lineHeight: 1.3, textAlign: "center",
          }}>
          <span className="wb-ledblink" style={{ flexShrink: 0 }}></span>
          {cur.face && <span className="rounded-full overflow-hidden inline-flex" style={{ background: "#2A0808", border: "2.5px solid #FF6A55", width: 30, height: 30, alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CharSprite id={cur.face} w={26} headOnly /></span>}
          <span style={{ minWidth: 0 }}>{cur.text}</span>
          <span className="wb-ledblink" style={{ flexShrink: 0 }}></span>
        </div>
      )}
    </div>
  );
};

const StringLights = () => (
  <svg width="100%" height={44} viewBox="0 0 600 44" preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0 }}>
    <path d="M 0 8 Q 150 40 300 12 Q 450 40 600 8" fill="none" stroke={INK} strokeWidth={2} opacity={.6} />
    {[40, 110, 180, 250, 320, 390, 460, 530].map((x, i) => (
      <circle key={i} cx={x} cy={i % 2 ? 26 : 18} r={5} fill="#FFE6A0" stroke={INK} strokeWidth={1.5} style={{ animation: `wbTwinkle ${1.6 + (i % 3) * 0.5}s ease-in-out infinite alternate` }} />
    ))}
  </svg>
);

/* ============================================================
    標題畫面像素場景（程式逐格繪製，取代原 base64 底圖）
   ============================================================ */
const TITLE_CAST = [
  { id: "e1", cx: 29.5, fy: 41.5, d: 0 },
  { id: "e2", cx: 17.0, fy: 34.0, d: 0.8 },
  { id: "e3", cx: 37.5, fy: 25.9, d: 1.6 },
  { id: "y3", cx: 69.5, fy: 41.5, d: 0.4, flip: 1 },
  { id: "y2", cx: 82.0, fy: 34.0, d: 1.2, flip: 1 },
  { id: "y4", cx: 61.5, fy: 25.9, d: 2.0, flip: 1 },
];

function TitleScene() {
  const cvRef = useRef(null);
  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    const W = 480, H = 270;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const clouds = [{ x: 40, y: 26, s: 1.6 }, { x: 200, y: 52, s: 1 }, { x: 330, y: 20, s: 1.3 }, { x: 430, y: 64, s: 0.8 }];
    const drawCloud = (x, y, s) => { rect(x, y + 4 * s, 26 * s, 8 * s, "#ffffff"); rect(x + 5 * s, y, 16 * s, 6 * s, "#ffffff"); rect(x + 3 * s, y + 12 * s, 20 * s, 3 * s, "#e9f6fd"); };
    const drawLantern = (x, topY, len) => {
      rect(x + 5, topY, 2, len, "#5a4a3a"); const y = topY + len;
      rect(x + 3, y, 6, 3, "#8f5c22"); rect(x, y + 3, 12, 14, "#C8102E"); rect(x + 2, y + 5, 8, 10, "#E5304C");
      rect(x + 5, y + 5, 2, 10, "#F2B234"); rect(x + 3, y + 17, 6, 3, "#8f5c22"); rect(x + 5, y + 20, 2, 5, "#F2B234");
    };
    const drawTable = (x, y) => {
      rect(x + 3, y - 4, 44, 7, "#FFF8EC");
      rect(x + 8, y - 2, 8, 3, "#f6cfd6"); rect(x + 22, y - 3, 8, 3, "#f6cfd6"); rect(x + 35, y - 2, 8, 3, "#f6cfd6");
      rect(x + 2, y + 3, 46, 16, "#E5304C"); rect(x + 2, y + 3, 46, 2, "#C8102E"); rect(x + 2, y + 17, 46, 3, "#8f0b21");
      rect(x + 9, y + 8, 3, 3, "#F2B234"); rect(x + 24, y + 11, 3, 3, "#F2B234"); rect(x + 39, y + 7, 3, 3, "#F2B234");
      rect(x - 9, y + 9, 9, 4, "#F2B234"); rect(x - 7, y + 13, 3, 8, "#5a4a3a");
      rect(x + 50, y + 9, 9, 4, "#F2B234"); rect(x + 52, y + 13, 3, 8, "#5a4a3a");
    };
    const drawArch = (x, y) => {
      rect(x, y - 56, 6, 56, "#FFF8EC"); rect(x + 44, y - 56, 6, 56, "#FFF8EC"); rect(x - 3, y - 64, 56, 8, "#FFF8EC");
      rect(x + 6, y - 62, 4, 4, "#f2b234"); rect(x + 24, y - 64, 4, 4, "#f6cfd6"); rect(x + 42, y - 62, 4, 4, "#f2b234");
      rect(x - 1, y - 40, 4, 4, "#f6cfd6"); rect(x + 48, y - 28, 4, 4, "#f6cfd6");
      rect(x, y - 2, 6, 2, "#37812E"); rect(x + 44, y - 2, 6, 2, "#37812E");
    };
    const bulbs = [];
    const drawScene = (t) => {
      g.clearRect(0, 0, W, H);
      rect(0, 0, W, 70, "#8FD3F0"); rect(0, 70, W, 50, "#9BDAF4"); rect(0, 120, W, 30, "#A8E0F5");
      for (const c of clouds) drawCloud(c.x, c.y, c.s);
      const gy = 150;
      rect(0, gy, 238, H - gy, "#A00D24");
      for (let r = 0; r < 5; r++) rect(0, gy + 10 + r * 24, 238, 4, "#C8102E");
      rect(0, gy, 238, 4, "#7c0c1e");
      rect(242, gy, W - 242, H - gy, "#4FA341"); rect(242, gy, W - 242, 4, "#37812E"); rect(238, gy, 4, H - gy, "#3c332b");
      const sp = [[258, 166], [286, 182], [318, 160], [352, 192], [388, 170], [420, 186], [450, 162], [300, 198], [368, 178], [440, 196]];
      for (const [x, y] of sp) rect(x, y, 3, 2, "#5FBF52");
      const fl = [[268, 176], [335, 190], [404, 194], [432, 172], [300, 162], [456, 184]];
      for (const [x, y] of fl) { rect(x, y, 3, 3, "#FFF8EC"); rect(x + 1, y + 1, 1, 1, "#F2B234"); }
      for (let i = 0; i < 4; i++) { rect(206 + i * 7, 142, 4, 30, "#4a4038"); rect(250 + i * 7, 142, 4, 30, "#4a4038"); }
      rect(202, 150, 34, 3, "#5a4f44"); rect(248, 150, 34, 3, "#5a4f44");
      rect(202, 162, 34, 3, "#5a4f44"); rect(248, 162, 34, 3, "#5a4f44");
      rect(236, 136, 10, 40, "#3c332b"); rect(232, 132, 18, 5, "#4a4038");
      drawLantern(52, 0, 32); drawLantern(124, 0, 16);
      drawTable(14, 170);
      drawArch(376, 150);
      g.strokeStyle = "#7a6a52"; g.lineWidth = 1;
      g.beginPath(); g.moveTo(424, 90); g.quadraticCurveTo(452, 102, 479, 84); g.stroke();
      if (!bulbs.length) for (let i = 0; i < 6; i++) bulbs.push({ x: 428 + i * 9 });
      bulbs.forEach((b, i) => {
        const on = reduced ? true : (Math.floor(t / 600) + i) % 3 !== 0;
        rect(b.x, 92 + ((i % 3) * 3), 2, 3, on ? "#F2B234" : "#8a7748");
      });
      for (const m of TITLE_CAST) {
        rect(m.cx / 100 * W - 16, H - m.fy / 100 * H - 2, 32, 4, "rgba(29,26,23,.22)");
      }
    };
    let raf;
    const tick = (t) => {
      for (const c of clouds) { c.x += 0.06 * c.s; if (c.x > W + 30) c.x = -50; }
      drawScene(t);
      raf = requestAnimationFrame(tick);
    };
    if (reduced) drawScene(0); else raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={cvRef} width={480} height={270} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", imageRendering: "pixelated" }} />;
}

/* ============================================================
   主元件
   ============================================================ */
export default function App() {
  const [phase, setPhase] = useState("title");
  const [role, setRole] = useState(null);
  const [charId, setCharId] = useState(null);
  const [zone, setZone] = useState("elder");
  const [elderScore, setElderScore] = useState(0);
  const [youthScore, setYouthScore] = useState(0);
  const [wallet, setWallet] = useState(START_WALLET);
  const [fines, setFines] = useState({});
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [led, setLed] = useState([{ text: "歡迎蒞臨婚禮大亂鬥會場", seq: 0 }, { text: "溫馨提示：問別人薪水前，請先公布自己的", seq: 1 }]);
  const [flash, setFlash] = useState(false);
  const [alert_, setAlert] = useState(false);
  const [modal, setModal] = useState(null);
  const [spoken, setSpoken] = useState([]);
  const [stat, setStat] = useState({ smuggle: 0, intercept: 0, comeback: 0, fined: 0, switched: 0, bribes: 0 });
  const [karaoke, setKaraoke] = useState(6);
  const [trapCd, setTrapCd] = useState(0);
  const [muted, setMuted] = useState(false);
  const [selFaction, setSelFaction] = useState("elder");
  const [selIdx, setSelIdx] = useState(0);

  /* 角色移動 */
  const [px, setPx] = useState(220);
  const [py, setPy] = useState(0); // 深度（往場景後方走）
  const [facing, setFacing] = useState(1);
  const [walking, setWalking] = useState(false);
  const [walkDur, setWalkDur] = useState(600);
  const [bubble, setBubble] = useState(null);
  const [expr, setExpr] = useState("idle");
  const [carried, setCarried] = useState(false);
  const [sneaking, setSneaking] = useState(false);
  const [disguised, setDisguised] = useState(false);
  const [seenIntro, setSeenIntro] = useState(false);
  const [photoFlash, setPhotoFlash] = useState(false);
  const [toastCd, setToastCd] = useState(0);
  const [truce, setTruce] = useState(0);
  const [lurker, setLurker] = useState(null);
  const [sings, setSings] = useState(0);       // 長輩卡拉OK 次數
  const [songs, setSongs] = useState(0);       // 年輕人點歌次數
  const [elderChoir, setElderChoir] = useState(false);
  const [youthParty, setYouthParty] = useState(false);
  const [npcReact, setNpcReact] = useState(null); // NPC 回話氣泡
  const [pops, setPops] = useState([]); // 飄分數字
  const [nowPlaying, setNowPlaying] = useState(null); // 卡拉OK 播放中
  const [shoutCd, setShoutCd] = useState(0);
  const [chaos, setChaos] = useState(0);          //  現場火爆指數（全場共同）
  const [shoutUses, setShoutUses] = useState(0);  // 大聲公已用次數
  const [bestLine, setBestLine] = useState(null); // 本場最精彩的一句話 {text, who, v}
  const [quitGroup, setQuitGroup] = useState(false); // 退出家庭群組大招
  const chaosRef = useRef(0); chaosRef.current = chaos;
  const lastChaosAt = useRef(Date.now());
  const [baitCd, setBaitCd] = useState(0);
  const [tarotCd, setTarotCd] = useState(0);
  const [tarotFx, setTarotFx] = useState(null); // wheel / power / tower

  /* 對話佇列：角色間的重要對話走固定底部對話框，玩家點一下才前進 */
  const [dlg, setDlg] = useState(null); // { lines:[{who, side, sprite, expr, text}], idx }
  const dlgRef = useRef(null); dlgRef.current = dlg;
  const dlgDoneRef = useRef(null);

  const audioRef = useRef(null);
  const modalRef = useRef(null); modalRef.current = modal;
  const truceRef = useRef(0); truceRef.current = truce;
  const lurkerRef = useRef(null); lurkerRef.current = lurker;
  const pxRef = useRef(px); pxRef.current = px;
  const roleRef = useRef(role); roleRef.current = role;
  const elderSRef = useRef(0); const youthSRef = useRef(0);
  const zoneRef = useRef(zone); zoneRef.current = zone;
  const walkCb = useRef(null);
  const worldRef = useRef(null);
  const busyRef = useRef(false);
  const [worldScale, setWorldScale] = useState(1);

  /* 手機橫向：場景改走「鏡頭跟隨」邏輯——縮放公式對齊場景實際所需高度（柵欄崗哨 330px 是
     最高元素，+30px 底距＝需要 360px），只縮小到「剛好不裁切」，不再為了塞進整個 2080px
     寬的場景而過度縮小，避免角色和道具小到點不到 */
  useEffect(() => {
    const el = worldRef.current;
    if (!el || phase !== "playing") return;
    const calc = () => setWorldScale(Math.min(1, Math.max(0.6, el.clientHeight / 380)));
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [phase]);

  const me = ALL_CHARS.find((c) => c.id === charId) || null;
  const isElder = role === "elder";
  const inElderZone = zone === "elder";

  /* ---- 音效 ---- */
  const beep = useCallback((freq = 880, dur = 0.12, type = "square", gain = 0.06) => {
    if (muted) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioRef.current = audioRef.current || new Ctx();
      const ctx = audioRef.current;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = type; o.frequency.value = freq; g.gain.value = gain;
      o.connect(g); g.connect(ctx.destination); o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.stop(ctx.currentTime + dur);
    } catch (e) { /* noop */ }
  }, [muted]);
  const alarm = useCallback(() => { beep(980, 0.18, "sawtooth", 0.07); setTimeout(() => beep(740, 0.18, "sawtooth", 0.07), 180); setTimeout(() => beep(980, 0.25, "sawtooth", 0.07), 360); }, [beep]);
  const cheer = useCallback(() => { beep(660, 0.1, "triangle"); setTimeout(() => beep(880, 0.1, "triangle"), 110); setTimeout(() => beep(1100, 0.2, "triangle"), 220); }, [beep]);
  const buzz = useCallback(() => beep(180, 0.3, "sawtooth", 0.08), [beep]);

  const addPop = useCallback((text, color) => {
    const id = Date.now() + Math.random();
    setPops((p) => [...p.slice(-3), { id, text, color: color || "#3E7C6E" }]);
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1500);
  }, []);

  const npcSay = useCallback((nid, text, expr, dur) => {
    setNpcReact({ id: nid, text, expr: expr || null });
    setTimeout(() => setNpcReact((w) => (w && w.id === nid && w.text === text ? null : w)), dur || 3800);
  }, []);

  const ledSeq = useRef(2);
  const pushLed = useCallback((text, face) => setLed((p) => [...p.slice(-11), { text, face, seq: ledSeq.current++ }]), []);
  elderSRef.current = elderScore; youthSRef.current = youthScore;
  const flashRed = useCallback(() => { setFlash(true); setTimeout(() => setFlash(false), 900); }, []);
  const addFine = useCallback((name, amt) => setFines((f) => ({ ...f, [name]: (f[name] || 0) + amt })), []);

  const showDlg = useCallback((lines, onDone) => {
    dlgDoneRef.current = onDone || null;
    setDlg({ lines: lines.filter(Boolean), idx: 0 });
  }, []);
  const advanceDlg = useCallback(() => {
    beep(660, 0.05, "square", 0.03);
    setDlg((d) => {
      if (!d) return d;
      if (d.idx + 1 < d.lines.length) return { ...d, idx: d.idx + 1 };
      const cb = dlgDoneRef.current; dlgDoneRef.current = null;
      if (cb) setTimeout(cb, 60);
      return null;
    });
  }, [beep]);

  /*  火爆指數：行動結果發生後才顯示變化；跨越階段時全場廣播 */
  const addChaos = useCallback((delta, line, who) => {
    lastChaosAt.current = Date.now();
    setChaos((c) => {
      const next = Math.max(0, Math.min(100, c + delta));
      const before = chaosStage(c), after = chaosStage(next);
      if (delta > 0 && after.min > before.min) {
        setTimeout(() => pushLed(`【現場快報】火爆指數進入「${after.label}」階段！（${next}）`), 400);
      }
      return next;
    });
    if (delta > 0) addPop(`火爆 +${delta}`, "#E5304C");
    if (line && delta > 0) setBestLine((b) => (!b || delta >= b.v ? { text: line, who: who || "", v: delta } : b));
  }, [addPop, pushLed]);

  /* 沒人出招場子會冷：每 6 秒無事件，火爆 −1 */
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => {
      if (Date.now() - lastChaosAt.current > 6000 && chaosRef.current > 0 && !modalRef.current) {
        setChaos((c) => Math.max(0, c - 1));
      }
    }, 3000);
    return () => clearInterval(t);
  }, [phase]);

  /* 火爆衝到 100：婚禮直接失控收場 */
  useEffect(() => {
    if (phase !== "playing" || chaos < 100) return;
    pushLed("【現場快報】火爆指數爆表！柵欄倒了！婚禮進入傳說模式！");
    const t = setTimeout(() => setPhase("ending"), 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaos >= 100, phase]);

  /* ---- 走路 ---- */
  const walkTo = useCallback((targetX, cb, opts = {}) => {
    if (busyRef.current) return;
    const from = pxRef.current;
    if (Math.abs(targetX - from) < 8) { if (opts.endFace) setFacing(opts.endFace); if (cb) cb(); return; }
    busyRef.current = true;
    setFacing(targetX > from ? 1 : -1);
    setWalking(true);
    setSneaking(!!opts.sneak);
    const dur = Math.min(2400, Math.max(420, Math.abs(targetX - from) * 3));
    setWalkDur(dur);
    setPx(targetX);
    if (opts.toY !== undefined) setPy(opts.toY);
    clearTimeout(walkCb.current);
    walkCb.current = setTimeout(() => {
      setWalking(false); setSneaking(false); busyRef.current = false;
      if (opts.endFace) setFacing(opts.endFace);
      if (cb) {
        setBubble("…");
        setTimeout(() => { setBubble(null); cb(); }, 550);
      }
    }, dur + 60);
  }, []);

  /* 走到 NPC「旁邊」並面向對方（不會疊在一起） */
  const approachNpc = useCallback((npcCenterX, cb) => {
    const from = pxRef.current;
    const side = from <= npcCenterX ? -1 : 1; // 從哪邊靠近就停在那邊
    walkTo(npcCenterX + side * 78, cb, { endFace: side === -1 ? 1 : -1 });
  }, [walkTo]);

  /*  點地面任意處  斜線走過去（含深度） */
  const onGroundClick = (e) => {
    if (phase !== "playing" || modal || dlg || carried) return;
    if (e.target.closest && e.target.closest(".wb-stop")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const wx = (e.clientX - rect.left) / worldScale;
    const wyB = (rect.bottom - e.clientY) / worldScale;
    let lo, hi;
    if (isElder) {
      if (inElderZone) { lo = 50; hi = WORLD.gateX - 105; } else { lo = WORLD.gateX + 70; hi = WORLD.width - 70; }
    } else { lo = WORLD.gateX + 50; hi = WORLD.width - 70; }
    const tx = Math.max(lo, Math.min(hi, wx));
    const ty = Math.max(0, Math.min(130, wyB - 62));
    clearTimeout(walkCb.current);
    busyRef.current = false;
    walkTo(tx, null, { toY: ty });
  };

  /*  鍵盤移動（電腦）：  左右走，  往場景深處/前方走 */
  const keysRef = useRef({});
  useEffect(() => {
    if (phase !== "playing") return;
    const kd = (e) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        keysRef.current[e.key] = true; e.preventDefault();
      }
    };
    const ku = (e) => { delete keysRef.current[e.key]; };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    const t = setInterval(() => {
      if (modalRef.current || dlgRef.current || busyRef.current) return;
      const k = keysRef.current;
      const dx = (k.ArrowRight ? 1 : 0) - (k.ArrowLeft ? 1 : 0);
      const dy = (k.ArrowUp ? 1 : 0) - (k.ArrowDown ? 1 : 0);
      if (!dx && !dy) { setWalking((w) => (w ? false : w)); return; }
      setWalkDur(90);
      if (dx) setFacing(dx);
      setWalking(true);
      setPx((p) => {
        let lo, hi;
        if (roleRef.current === "elder") {
          if (zoneRef.current === "elder") { lo = 50; hi = WORLD.gateX - 105; }
          else { lo = WORLD.gateX + 70; hi = WORLD.width - 70; }
        } else { lo = WORLD.gateX + 50; hi = WORLD.width - 70; }
        return Math.max(lo, Math.min(hi, p + dx * 11));
      });
      if (dy) setPy((p) => Math.max(0, Math.min(130, p + dy * 9)));
    }, 50);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); clearInterval(t); keysRef.current = {}; };
  }, [phase]);

  /* 鏡頭跟隨 */
  useEffect(() => {
    if (phase !== "playing") return;
    const el = worldRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      const target = px * worldScale - el.clientWidth / 2 + 60 * worldScale;
      el.scrollTo({ left: Math.max(0, target), behavior: walkDur < 150 ? "auto" : "smooth" });
    }, 60);
    return () => clearTimeout(t);
  }, [px, worldScale, phase]);

  /* ---- 倒數 ---- */
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => {
      if (modalRef.current || dlgRef.current) return; // 對話進行時暫停倒數
      setTimeLeft((s) => { if (s <= 1) { clearInterval(t); setPhase("ending"); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (trapCd <= 0) return;
    const t = setTimeout(() => setTrapCd((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [trapCd]);
  useEffect(() => { if (shoutCd <= 0) return; const t = setTimeout(() => setShoutCd((c) => c - 1), 1000); return () => clearTimeout(t); }, [shoutCd]);
  useEffect(() => { if (baitCd <= 0) return; const t = setTimeout(() => setBaitCd((c) => c - 1), 1000); return () => clearTimeout(t); }, [baitCd]);
  useEffect(() => { if (tarotCd <= 0) return; const t = setTimeout(() => setTarotCd((c) => c - 1), 1000); return () => clearTimeout(t); }, [tarotCd]);

  useEffect(() => {
    if (toastCd <= 0) return;
    const t = setTimeout(() => setToastCd((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [toastCd]);

  useEffect(() => {
    if (truce <= 0) return;
    const t = setTimeout(() => setTruce((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [truce]);

  /*  大合照休戰：一場只觸發一次（隨機時間），全場和好 10 秒 */
  useEffect(() => {
    if (phase !== "playing") return;
    let alive = true;
    const fire = () => {
      if (!alive) return;
      if (modalRef.current || dlgRef.current || truceRef.current > 0 || busyRef.current) { setTimeout(fire, 4000); return; }
      setTruce(10);
      setPhotoFlash(true); setTimeout(() => setPhotoFlash(false), 450);
      setElderScore((s) => s + 100); setYouthScore((s) => s + 100);
      addPop("+100 合照加分");
      beep(660, 0.1, "triangle"); setTimeout(() => beep(990, 0.18, "triangle"), 130);
      pushLed("【快訊】 全場大合照時間！長輩、年輕人暫時和好（耶）雙方 +100");
      setBubble("耶"); setTimeout(() => setBubble(null), 2400);
    };
    const t = setTimeout(fire, 40000 + Math.random() * 70000);
    return () => { alive = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ---- AI 模擬 ---- */
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => {
      /* 對面陣營的 NPC 也在推高火爆指數（全場共同進度） */
      const pts = 100 + Math.floor(Math.random() * 170);
      if (role === "elder") {
        setYouthScore((s) => s + pts); pushLed(rand(AI_YOUTH_EVENTS));
      } else {
        setElderScore((s) => s + pts); pushLed(rand(AI_ELDER_EVENTS));
        if (Math.random() < 0.35) {
          const who = rand(ELDERS); const p = rand(MINE_PHRASES);
          addFine(who.name, p.fine);
          pushLed(`${who.name}！罰 $${p.fine}！原因：${p.category}`, who.id);
        }
      }
      addChaos(2);
    }, 9000);
    return () => clearInterval(t);
  }, [phase, role, pushLed, addFine, addChaos]);

  /* ---- 年輕人事件 ---- */
  useEffect(() => {
    if (phase !== "playing" || role !== "youth") return;
    let alive = true; let t;
    const loop = () => {
      t = setTimeout(() => {
        if (!alive) return;
        if (!modalRef.current && !dlgRef.current && !busyRef.current && truceRef.current <= 0) (Math.random() < 0.5 ? spawnVerify : spawnCardBattle)();
        loop();
      }, 8000 + Math.random() * 8000);
    };
    loop();
    return () => { alive = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, role]);

  const spawnVerify = () => {
    const elder = rand(ELDERS);
    const others = sample(YOUTHS.filter((y) => y.id !== charId), 2);
    const ECLUES = ["戴鴨舌帽，但手裡握著保溫杯", "穿帽T，口袋露出一截老花眼鏡", "球鞋全新，站姿卻像在等公車", "說在聽 Podcast，耳機線沒插"];
    const YCLUES = ["低頭回限動，手搖飲去冰微糖", "在拍 OOTD，鞋是限量聯名", "邊走邊滑手機差點撞到柱子", "脖子還掛著沒拆的工作證", "問 WiFi 密碼的速度快到殘影"];
    const yc = sample(YCLUES, 2);
    const people = sample([
      { sprite: { id: elder.id, disguise: true }, label: rand(ECLUES), isElder: true },
      { sprite: { id: others[0].id, disguise: true }, label: yc[0], isElder: false },
      { sprite: { id: others[1].id, disguise: true }, label: yc[1], isElder: false },
    ], 3);
    alarm(); flashRed(); setAlert(true);
    pushLed("邊界警報！有不明人士試圖混入年輕人區！");
    setModal({ type: "verify", people, elder, left: 6 });
  };

  /*  攔截倒數：6 秒內沒抓到，長輩直接混進來 */
  useEffect(() => {
    if (!modal || modal.type !== "verify") return;
    const eld = modal.elder;
    const t0 = Date.now();
    const t = setInterval(() => {
      const left = 6 - (Date.now() - t0) / 1000;
      if (left <= 0) {
        clearInterval(t);
        setModal(null); setAlert(false);
        buzz(); flashRed();
        setElderScore((s) => s + 300);
        addPop("來不及判斷！長輩 +300", "#7A3A8E");
        pushLed(`猶豫就會敗北！${eld.name} 趁你猶豫大搖大擺走了進來（長輩 +300）`, eld.id);
        setTimeout(() => { if (!modalRef.current) spawnCardBattle(); }, 2500);
      } else {
        setModal((m) => (m && m.type === "verify" ? { ...m, left } : m));
      }
    }, 100);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal && modal.type]);

  const spawnCardBattle = () => {
    const elder = rand(ELDERS);
    beep(520, 0.15, "square");
    setModal({ type: "cards", elder, phrase: rand(MINE_PHRASES), cards: sample(COMEBACK_CARDS, 3) });
  };

  /*  可疑長輩在邊界徘徊（年輕人的主動攻擊目標） */
  useEffect(() => {
    if (phase !== "playing" || role !== "youth") { setLurker(null); return; }
    let alive = true; let t;
    const loop = (delay) => {
      t = setTimeout(() => {
        if (!alive) return;
        if (!lurkerRef.current && truceRef.current <= 0) {
          const l = { elder: rand(ELDERS), x: WORLD.gateX + 170 + Math.floor(Math.random() * 150), born: Date.now() };
          setLurker(l);
          pushLed("有可疑長輩在邊界附近徘徊…主動搭話陰他一波！", l.elder.id);
          setTimeout(() => { if (alive && lurkerRef.current && lurkerRef.current.born === l.born) setLurker(null); }, 22000);
        }
        loop(16000 + Math.random() * 12000);
      }, delay);
    };
    loop(7000);
    return () => { alive = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, role]);

  /* ---- 長輩：講話 ---- */
  const openTalk = (npcId) => {
    if (truceRef.current > 0) { setBubble("拍照中啦！比 YA"); setTimeout(() => setBubble(null), 2000); return; }
    const pool = MINE_PHRASES.filter((p) => !spoken.includes(p.id));
    const npc = YOUTHS.find((y) => y.id === npcId) || rand(YOUTHS.filter((y) => y.id !== charId));
    setModal({ type: "talk", mines: sample(pool.length ? pool : MINE_PHRASES, 2), safe: rand(SAFE_PHRASES), npc });
  };

  const speak = (p) => {
    const npcId = modal && modal.npc ? modal.npc.id : null;
    setModal(null);
    if (!p) {
      setElderScore((s) => s + 50); addPop("+50 長輩分");
      setBubble("今天天氣真好～"); setTimeout(() => setBubble(null), 2000);
      if (npcId) setTimeout(() => npcSay(npcId, gline(rand(RPSAFE), charId)), 600);
      pushLed(`${me.name} 講了句場面話，大家點頭微笑 +50`, me.id);
      beep(660, 0.1, "triangle"); return;
    }
    setSpoken((sp) => [...sp, p.id]);
    setBubble(`「${p.text}」`);
    const catchChance = Math.max(0.1, CATCH_RATE[p.severity] - (me?.stats.stealth || 0) * 0.04);
    setTimeout(() => {
      setBubble(null);
      if (Math.random() < catchChance) {
        alarm(); flashRed(); setExpr("shock");
        setWallet((w) => w - p.fine);
        addFine(me.name, p.fine);
        setStat((s) => ({ ...s, fined: s.fined + 1 }));
        pushLed(`${me.name} 被開罰單！罰 $${p.fine}，原因：${p.category}`, me.id);
        const npcObj = npcId ? YOUTHS.find((y) => y.id === npcId) : null;
        showDlg([
          npcObj && { who: npcObj.name, side: "youth", sprite: npcObj.id, text: gline(rand(RPHIT), charId) },
          { who: "婚宴糾察隊", side: "sys", text: `逮到了！「${p.category}」現行犯，罰紅包 $${p.fine}。（只扣錢，火爆指數不受影響）` },
        ]);
        if (p.severity === "severe" || p.severity === "fatal") {
          addPop("免費送回長輩區", "#7A6A55");
          addChaos(CHAOS.carry, `${me.name} 被保鏢架走時大喊「我也沒說什麼啊！」`, me.name);
          setCarried(true); busyRef.current = true;
          setBubble("我也沒說什麼啊！");
          setFacing(-1); setWalkDur(2000); setPx(300);
          setTimeout(() => {
            setCarried(false); setBubble(null); setExpr("idle");
            setZone("elder"); setDisguised(false); setPy(0); busyRef.current = false;
            pushLed(`${me.name} 已被保鏢護送回長輩區——偷渡小遊戲，再開！`, me.id);
          }, 2200);
        } else {
          setTimeout(() => setExpr("idle"), 1200);
        }
      } else {
        const gain = MINE_GAIN[p.severity] || 300;
        setElderScore((s) => s + gain);
        addChaos(CHAOS.mine, `「${p.text}」`, me.name);
        cheer();
        const npcObj = npcId ? YOUTHS.find((y) => y.id === npcId) : null;
        pushLed(`${me.name} 講完「${p.text}」，全場空氣凝結三秒`, me.id);
        showDlg([
          npcObj && { who: npcObj.name, side: "youth", sprite: npcObj.id, text: gline(rand(RPDODGE), charId) },
          { who: "現場狀況", side: "sys", text: `這句話沒人攔得住，空氣凝結三秒。現場火爆指數 +${CHAOS.mine}。` },
        ]);
      }
    }, 1000);
  };

  /* ---- 偷渡 ---- */
  const smuggleSuccess = (msg) => {
    setModal(null);
    setZone("youth");
    setElderScore((s) => s + 500);
    setStat((s) => ({ ...s, smuggle: s.smuggle + 1 }));
    addChaos(CHAOS.gate);
    cheer();
    pushLed(`${me.name} ${msg}，成功潛入年輕人區！`, me.id);
    busyRef.current = false;
    walkTo(WORLD.youthEntry, null, { sneak: true, toY: 0 });
  };
  const smuggleFail = (msg) => {
    setModal(null);
    buzz(); flashRed(); setExpr("shock");
    pushLed(`${me.name}，${msg}，請回長輩區`, me.id);
    setTimeout(() => setExpr("idle"), 1200);
    walkTo(WORLD.gateX - 190, null, { toY: 0 });
  };

  const startSmuggle = (method) => {
    if (method === "quiz") setModal({ type: "quiz", q: rand(QUIZ) });
    else if (method === "disguise") {
      const pool = [...sample(OUTFITS.filter((o) => o.ok), 1), ...sample(OUTFITS.filter((o) => !o.ok), 2)];
      setModal({ type: "disguise", options: sample(pool, 3) });
    }
    else if (method === "bribe") {
      if (stat.bribes >= 2) { pushLed("守門人：「再收要被新娘發現了啦！」（每場限賄賂 2 次）"); setModal(null); return; }
      if (wallet < 1800) { pushLed(`${me.name} 紅包基金不足（賄賂要 $1800）`, me.id); setModal(null); return; }
      setWallet((w) => w - 1800);
      addPop("−$1800 紅包", "#C8102E");
      setStat((s) => ({ ...s, bribes: s.bribes + 1 }));
      if (Math.random() < 0.75) { setElderScore((s) => s + 100); smuggleSuccess("用紅包收買守門人"); }
      else smuggleFail("守門人收了紅包還是把你舉報了");
    }
    else if (method === "climb") setModal({ type: "climb" });
    else if (method === "steps") setModal({ type: "steps" });
    else if (method === "cart") setModal({ type: "cart" });
  };

  /* ---- 年輕人互動 ---- */
  const pickVerify = (person) => {
    const m = modal; setModal(null); setAlert(false);
    if (person.isElder) {
      setYouthScore((s) => s + 400);
      setStat((s) => ({ ...s, intercept: s.intercept + 1 }));
      addChaos(CHAOS.verify + CHAOS.carry, `${m.elder.name} 被當眾拆穿假髮，全場拍手`, me.name);
      cheer();
      pushLed(`${me.name} 攔截成功！${m.elder.name} 驗證失敗，被押回長輩區`, m.elder.id);
      setModal({ type: "shame", elder: m.elder });
    } else {
      buzz(); flashRed();
      setElderScore((s) => s + 300);
      addChaos(4, null, null); // 抓錯人全場爆笑，場面照樣升溫
      addPop("抓錯人！", "#7A3A8E");
      pushLed(`抓錯人了！${m.elder.name} 趁亂大搖大擺混進年輕人區，全場爆笑`, m.elder.id);
      setTimeout(() => { if (!modalRef.current) spawnCardBattle(); }, 2500);
    }
  };

  const playCard = (card) => {
    const m = modal; setModal(null);
    /*  嗆過頭翻車：不扣分，但被新娘回頭瞪，原地罰站＋公審（鏡像長輩被架走） */
    if (card.risk && Math.random() < card.risk) {
      buzz(); flashRed(); setExpr("shock");
      setCombo(0);
      pushLed(`${me.name} 嗆過頭！新娘親自回頭關切，罰站反省中`, me.id);
      busyRef.current = true;
      showDlg([
        { who: me.name, side: "youth", sprite: me.id, text: cardLine(card, m.elder) },
        { who: "現場狀況", side: "sys", text: "（新娘回頭瞪了一眼……全場安靜）" },
        { who: m.elder.name, side: "elder", sprite: m.elder.id, text: "唉唷～連新娘都看不下去囉？" },
      ], () => { setExpr("idle"); busyRef.current = false; });
      return;
    }
    const n = combo + 1;
    setCombo(n); setMaxCombo((x) => Math.max(x, n));
    let total = card.gain + (n >= 2 ? 200 : 0);
    if (tarotFx === "power") { total = Math.round(total * 1.5); setTarotFx(null); addPop("宇宙能量加成！"); }
    setYouthScore((s) => s + total);
    addChaos(CHAOS.comeback + (n >= 2 ? CHAOS.chain : 0), cardLine(card, m.elder), me.name);
    if (n >= 2) addPop(`交鋒連鎖 ×${n}`);
    setStat((s) => ({ ...s, comeback: s.comeback + 1 }));
    cheer();
    const rc = CRPLY[card.id] || ["……", null];
    const chaosGain = CHAOS.comeback + (n >= 2 ? CHAOS.chain : 0);
    showDlg([
      { who: me.name, side: "youth", sprite: me.id, text: cardLine(card, m.elder) },
      { who: m.elder.name, side: "elder", sprite: m.elder.id, expr: rc[1], text: rc[0] },
      { who: "現場狀況", side: "sys", text: `${m.elder.name}${card.effect}。現場火爆指數 +${chaosGain}${n >= 2 ? `（交鋒連鎖 ×${n}）` : ""}。` },
    ]);
    if (card.id === "c5") pushLed(`${me.name} 使出『核彈卡』！${m.elder.name} 已陣亡，全場歡呼！+${total}，長輩 −${card.dmg}`, m.elder.id);
    else pushLed(`${me.name} 使出『${card.name}』：${m.elder.name} ${card.effect}！+${total}${card.dmg > 0 ?`，長輩 −${card.dmg}`: ""}`, me.id);
    if (n === 2) pushLed("2 連擊！獲得稱號：高 EQ 青年");
    if (n === 3) pushLed("3 連擊！全場年輕人起立鼓掌！");
    if (n >= 5) pushLed("5 連擊！『年輕人之光』特效全開！");
  };

  const ignoreCard = () => {
    const m = modal; setModal(null);
    setCombo(0);
    setElderScore((s) => s + 300);
    setChaos((c) => Math.max(0, c - 3)); // 已讀不回，場子冷掉
    buzz();
    showDlg([
      { who: m.elder.name, side: "elder", sprite: m.elder.id, text: rand(CIGN) },
      { who: "現場狀況", side: "sys", text: "沒人接話，場子冷掉了。現場火爆指數 −3。" },
    ]);
    pushLed(`${m.elder.name} 講完「${m.phrase.text}」沒人反擊，氣勢大增 +300`, m.elder.id);
  };

  const setTrap = () => {
    if (truceRef.current > 0) { setBubble("拍照中啦！比 YA"); setTimeout(() => setBubble(null), 2000); return; }
    if (trapCd > 0) return;
    setTrapCd(20);
    const trap = rand(TRAPS);
    setBubble(`「${trap.name}」設好了，嘿嘿`); setTimeout(() => setBubble(null), 2200);
    if (Math.random() < 0.6) {
      const who = rand(ELDERS);
      setYouthScore((s) => s + 400);
      setStat((s) => ({ ...s, intercept: s.intercept + 1 }));
      addChaos(CHAOS.carry, `${who.name} ${trap.ok}`, me.name);
      cheer();
      pushLed(`【${trap.name}】${who.name} ${trap.ok}！`, who.id);
    } else pushLed(`【${trap.name}】${trap.fail}`);
  };

  const publicShame = (elder) => {
    setModal(null);
    setYouthScore((s) => s + 100);
    beep(1200, 0.08); setTimeout(() => beep(1200, 0.08), 120);
    pushLed(`公審：${elder.name} 偷渡未遂全紀錄已上 LED 大螢幕 +100`, elder.id);
  };

  /*  向新人敬酒（30 秒冷卻）：回血加分 */
  const doToast = () => {
    if (truceRef.current > 0) { setBubble("拍照中啦！比 YA"); setTimeout(() => setBubble(null), 2000); return; }
    if (toastCd > 0) { setBubble(`剛敬過啦，${toastCd} 秒後再來`); setTimeout(() => setBubble(null), 2100); return; }
    setToastCd(30);
    cheer();
    setBubble("新婚快樂！乾杯"); setTimeout(() => setBubble(null), 2300);
    if (isElder) {
      setWallet((w) => w + 600); setElderScore((s) => s + 100);
      addPop("+$600 紅包基金"); addPop(isElder ? "+100 長輩分" : "+150 年輕人分");
      pushLed(`${me.name} 向新人敬酒，超有誠意！紅包基金回血 +$600`, me.id);
    } else {
      setYouthScore((s) => s + 150);
      pushLed(`${me.name} 向新人敬酒，士氣大振 +150`, me.id);
    }
  };

  /*  年輕人社畜搭話：表面客氣，實際在陰人 */
  const openSchmooze = () => {
    if (!lurkerRef.current) return;
    setModal({ type: "schmooze", elder: lurkerRef.current.elder, opts: sample(SCHMOOZE, 3) });
  };

  const resolveSchmooze = (opt) => {
    const m = modal; setModal(null);
    setBubble(`「${gline(opt.line, m.elder)}」`);
    const detect = Math.min(0.45, (m.elder.stats.defense || 3) * 0.08); // 長輩感知力 = 防禦值
    setTimeout(() => {
      setBubble(null);
      const cursed = tarotFx === "tower";
      if (cursed) setTarotFx(null);
      if (cursed || Math.random() < detect) {
        buzz(); flashRed();
        setCombo(0);
        setElderScore((s) => s + 100);
        setExpr("shock"); busyRef.current = true;
        pushLed(`${m.elder.name} 不吃這套！反手一句「你是不是交不到對象才這樣講話？」`, m.elder.id);
        showDlg([
          { who: m.elder.name, side: "elder", sprite: m.elder.id, text: "少跟我來這套！你是不是交不到對象才這樣講話？" },
          { who: "現場狀況", side: "sys", text: "被識破了，你原地石化三秒。" },
        ], () => { busyRef.current = false; setExpr("idle"); });
      } else {
        cheer();
        setYouthScore((s) => s + 250);
        addChaos(CHAOS.comeback, `「${gline(opt.line, m.elder)}」`, me.name);
        setStat((s) => ({ ...s, comeback: s.comeback + 1 }));
        pushLed(`${me.name} 使出「${opt.name}」！${m.elder.name} ${opt.ok}`, m.elder.id);
        showDlg([
          { who: me.name, side: "youth", sprite: me.id, text: gline(opt.line, m.elder) },
          { who: m.elder.name, side: "elder", sprite: m.elder.id, expr: ERPX[opt.id] || null, text: gline(ERPLY[opt.id] || "……", m.elder) },
          { who: "現場狀況", side: "sys", text: `${m.elder.name}${opt.ok}。現場火爆指數 +${CHAOS.comeback}。` },
        ]);
      }
      setTimeout(() => setLurker(null), 2000);
    }, 1100);
  };

  /*  年輕人同伴閒聊 */
  const peerChat = (id) => {
    const mine = rand(["欸這場 DJ 不錯欸", "撐住，柵欄那邊剛剛有動靜", "等等一起去掃 buffet", "我社交額度快用完了"]);
    setBubble(mine); setTimeout(() => setBubble(null), 2200);
    setYouthScore((s) => s + 20); addPop("+20");
    setTimeout(() => npcSay(id, rand(["真的", "收到，我盯著", "+1，蝦子先搶", "懂，我也在裝忙"]), null, 3200), 900);
  };

  /*  大聲公：全場都聽見了（每人每場限 SHOUT_LIMIT 次）
     流程：對話框選嗆聲  短暫集中演出  跑馬燈全場重播  對面必有反應  火爆 +10 */
  const doShout = (s) => {
    setModal(null); setShoutCd(15);
    setShoutUses((n) => n + 1);
    setPhotoFlash(true); setTimeout(() => setPhotoFlash(false), 350); // 集中演出閃光
    addChaos(CHAOS.shout, `「${s.line}」`, me.name);
    pushLed(`【大聲公】${me.name}：「${s.line}」——全場都聽見了`, me.id);
    let reply;
    if (isElder) {
      setElderScore((sc) => sc + (s.v || 80));
      const yn = rand(["y1", "y2", "y3"].filter((i) => i !== charId));
      const yo = YOUTHS.find((y) => y.id === yn);
      reply = { who: yo.name, side: "youth", sprite: yn, text: gline(rand(RPDODGE), charId) };
    } else {
      setYouthScore((sc) => sc + (s.v || 80));
      const en = rand(["e1", "e2", "e4"].filter((i) => i !== charId));
      const eo = ELDERS.find((e) => e.id === en);
      reply = { who: eo.name, side: "elder", sprite: en, expr: "shock", text: rand(["現在的年輕人喔…", "哎唷！大小聲什麼啦！", "我聽你在放送啦！"]) };
    }
    showDlg([
      { who: `${me.name}（大聲公）`, side: isElder ? "elder" : "youth", sprite: me.id, text: s.line },
      reply,
      { who: "現場狀況", side: "sys", text: `全場都聽見了，跑馬燈正在重播。現場火爆指數 +${CHAOS.shout}。` },
    ]);
  };

  /*  長輩設年輕人誘餌 */
  const setBait = () => {
    setModal(null);
    if (baitCd > 0) return;
    setBaitCd(25);
    const b = rand(YBAITS);
    setBubble(`「${b.name}」攤位搭好了，嘿嘿`); setTimeout(() => setBubble(null), 2500);
    if (Math.random() < 0.45) {
      const who = rand(YOUTHS);
      setYouthScore((s) => s - 150); addPop("誘餌成功！年輕人 −150", "#7A3A8E");
      setElderScore((s) => s + 100); addPop("+100 長輩分");
      pushLed(`【誘餌】年輕人防線因「${b.name}」出現缺口！${who.name} ${b.joke}（年輕人 −150）`, who.id);
    } else {
      pushLed(`【誘餌】「${b.name}」攤位乏人問津…年輕人邊滑手機邊說不要（但有偷看）`);
    }
  };

  /*  靈性角落抽塔羅 */
  const drawTarot = () => {
    setModal(null); setTarotCd(25);
    const c = rand(TAROTS);
    setBubble("（雙手合十）感恩宇宙"); setTimeout(() => setBubble(null), 2600);
    if (c.id === "wheel") { setTarotFx("wheel"); addPop("下次警報有提示"); }
    else if (c.id === "power") { setTarotFx("power"); addPop("下次回嗆 ×1.5"); }
    else if (c.id === "tower") { setTarotFx("tower"); addPop("水逆纏身…", "#7A3A8E"); }
    else addPop("……沒事發生");
    pushLed(`${me.name} 抽到「${c.name}」——${c.joke}`, me.id);
  };

  /*  長輩區場景互動：沙發、圓桌、茶水、麻將 */
  const elderZoneAct = (id) => {
    if (id === "mahjong") {
      const r = Math.random();
      if (r < 0.3) {
        cheer();
        setElderScore((s) => s + 150); setWallet((w) => w + 200);
        addPop("+150 自摸！"); addPop("+$200");
        setBubble("自摸！哈哈哈！"); setTimeout(() => setBubble(null), 2400);
        pushLed(`${me.name} 麻將桌自摸！贏 $200，三叔公臉都綠了 +150`, me.id);
        if (charId !== "e3") npcSay("e3", "唉唷！又被你摸走！", "shock", 3600);
      } else if (r < 0.5) {
        buzz();
        setWallet((w) => w - 100); addPop("−$100 放槍", "#C8102E");
        setBubble("唉唷…放槍，輸 $100"); setTimeout(() => setBubble(null), 2400);
        pushLed(`${me.name} 麻將桌放槍，輸了 $100，面子有點掛不住`, me.id);
        if (charId !== "e3") npcSay("e3", "胡啦！哈哈，你放的槍齁", null, 3800);
      } else {
        beep(523, 0.12, "triangle");
        setElderScore((s) => s + 30);
        setBubble(rand(["碰！", "這牌烏鴉鴉…換一張", "欸你打那張我等很久了"])); setTimeout(() => setBubble(null), 2200);
      }
      return;
    }
    const lines = EZLINES[id];
    if (!lines) { setBubble("…"); setTimeout(() => setBubble(null), 800); return; }
    setElderScore((s) => s + 30); addPop("+30");
    beep(587, 0.1, "triangle");
    setBubble(rand(lines)); setTimeout(() => setBubble(null), 2500);
    const rp = EZREPLY[id];
    if (rp && charId !== rp.npc && Math.random() < 0.85) setTimeout(() => npcSay(rp.npc, rand(rp.lines)), 900);
    if (id === "sofa") pushLed(`${me.name} 在沙發區喬了一個舒服的位置 +30`, me.id);
    if (id === "table") pushLed(`${me.name} 在辦桌圓桌開啟勸菜模式 +30`, me.id);
    if (id === "tea") pushLed(`${me.name} 在茶水吧台研究無糖選項 +30`, me.id);
  };

  const singKaraoke = () => setModal({ type: "ksong", options: sample(KSONGS, 3) });

  const pickKaraoke = (s) => {
    setModal(null);
    setNowPlaying(s.t); setTimeout(() => setNowPlaying((c) => (c === s.t ? null : c)), 6500);
    const n = sings + 1;
    setSings(n);
    if (s.mood === "sad") {
      /*  婚禮唱悲歌：全場凝結 */
      buzz(); flashRed();
      setElderScore((sc) => sc - 150); setYouthScore((sc) => sc + 100);
      addPop("−150 唱悲歌！", "#C8102E");
      setBubble(`有一日咱若老…`); setTimeout(() => setBubble(null), 2600);
      pushLed(`【婚禮快訊】有人在婚禮唱《${s.t}》！新娘眼眶泛紅，DJ 小胖緊急切歌救場（長輩 −150／年輕人 +100）`, me.id);
      if (charId !== "e1") setTimeout(() => npcSay("e1", "唱這要哭欸！緊換歌啦！", "shock", 3800), 800);
      return;
    }
    if (s.mood === "hype") {
      cheer(); setTimeout(() => beep(880, 0.2, "triangle"), 250);
      setElderScore((sc) => sc + 200); addPop("+200 全場歡呼！");
      setElderChoir(true); setTimeout(() => setElderChoir(false), 5000);
      setBubble("三分天注定！七分靠打拚！"); setTimeout(() => setBubble(null), 2600);
      pushLed(`${me.name} 唱《愛拚才會贏》全場歡呼！長輩區起立大合唱 +200`, me.id);
    } else if (s.mood === "happy") {
      cheer();
      setElderScore((sc) => sc + 150); addPop("+150 長輩分");
      setBubble("歡喜就好～人生短短～"); setTimeout(() => setBubble(null), 2600);
      pushLed(`${me.name} 唱《歡喜就好》，氣氛輕鬆全場拍手 +150`, me.id);
    } else if (s.mood === "sweet") {
      cheer();
      setElderScore((sc) => sc + 150); setWallet((w) => w + 100);
      addPop("+150 長輩分"); addPop("+$100 紅包");
      setBubble("甜蜜蜜～你笑得甜蜜蜜～"); setTimeout(() => setBubble(null), 2600);
      pushLed(`${me.name} 唱《甜蜜蜜》超應景！新人感動加碼紅包 $100 +150`, me.id);
    } else {
      beep(440, 0.3, "sine", 0.05);
      setKaraoke((k) => k + 1);
      setElderScore((sc) => sc + 100); addPop("+100 長輩分");
      setBubble("你問我愛你有多深～"); setTimeout(() => setBubble(null), 2600);
      pushLed(`長輩區卡拉OK：月亮代表我的心（第 ${karaoke + 1} 次）+100`, me.id);
    }
    if (n % 3 === 0) {
      /* 長輩合唱團：全部長輩聚過來一起搖擺 */
      setElderChoir(true); setTimeout(() => setElderChoir(false), 5000);
      setElderScore((s) => s + 300); addPop("+300 合唱團！");
      setTimeout(() => beep(494, 0.25, "sine", 0.05), 300); setTimeout(() => beep(554, 0.3, "sine", 0.05), 600);
      pushLed(`【長輩合唱團】全長輩區起立大合唱！氣勢如虹 +300`, me.id);
    }
    if (n % 5 === 0) {
      setYouthScore((s) => s - 100);
      pushLed("【音量戰】卡拉OK 音量突破天際，年輕人區 Lo-fi 慘遭蓋台（年輕人 −100）");
    }
    if (n >= 3) pushLed(`音量PK 戰況：卡拉OK ${n} 首 vs DJ ${songs} 首`);
  };

  /*  年輕人點歌（DJ 台）：卡拉OK 的反制 */
  const openSongModal = () => {
    if (truceRef.current > 0) { setBubble("拍照中啦！比 YA"); setTimeout(() => setBubble(null), 2000); return; }
    setModal({ type: "song", options: sample(SONGS, 3) });
  };

  const pickSong = (s) => {
    setModal(null);
    const n = songs + 1;
    setSongs(n);
    setYouthScore((sc) => sc + 100); addPop("+100 年輕人分");
    beep(523, 0.18, "triangle", 0.05); setTimeout(() => beep(659, 0.22, "triangle", 0.05), 180);
    setBubble(`${s.t}～`); setTimeout(() => setBubble(null), 2300);
    pushLed(`${me.name} 點了 ${s.a}〈${s.t}〉，年輕人區氣氛 UP +100`, me.id);
    if (n % 3 === 0) {
      /* 年輕人全場大合唱：反殺蓋台 */
      setYouthParty(true); setTimeout(() => setYouthParty(false), 5000);
      setYouthScore((sc) => sc + 300); addPop("+300 反殺蓋台！");
      setElderScore((sc) => sc - 100);
      pushLed("【音量戰】DJ 直接開到最大！卡拉OK 慘遭反殺蓋台，全場年輕人大合唱 +300（長輩 −100）");
    }
    if (n >= 3) pushLed(`音量PK 戰況：卡拉OK ${sings} 首 vs DJ ${n} 首`);
  };

  /* ---- 開始 / 重置（婚禮開始後鎖定角色與陣營，不再倒戈） ---- */
  const startGame = (c) => {
    const toElder = c.id.startsWith("e");
    setRole(toElder ? "elder" : "youth");
    setCharId(c.id);
    setZone(toElder ? "elder" : "youth");
    setPx(toElder ? 220 : WORLD.youthEntry + 200); setPy(0);
    setPhase("playing");
    pushLed(`${c.name} 進場！戰鬥開始！`, c.id);
  };
  /* 「再舉辦一次婚禮」：回到角色選擇（鼓勵換人換陣營），不是同角色立即重玩 */
  const resetGame = () => {
    setPhase("select"); setRole(null); setCharId(null); setZone("elder");
    setElderScore(0); setYouthScore(0); setWallet(START_WALLET); setFines({});
    setTimeLeft(GAME_SECONDS); setCombo(0); setMaxCombo(0); setSpoken([]);
    setChaos(0); setShoutUses(0); setBestLine(null); setQuitGroup(false);
    setStat({ smuggle: 0, intercept: 0, comeback: 0, fined: 0, switched: 0, bribes: 0 });
    setLed([{ text: "歡迎蒞臨婚禮大亂鬥會場", seq: ledSeq.current++ }]);
    setModal(null); setKaraoke(6); setTrapCd(0); setCarried(false); setBubble(null); setExpr("idle"); setDisguised(false); setTruce(0); setToastCd(0); setLurker(null); setSings(0); setSongs(0); setElderChoir(false); setYouthParty(false); setNpcReact(null); setPy(0); setShoutCd(0); setBaitCd(0); setTarotCd(0); setTarotFx(null);
    busyRef.current = false;
  };

  /* 結局由「終場火爆指數」決定，不再判斷哪一方獲勝 */
  const getEnding = () => {
    if (quitGroup) return { title: "已讀，退群", crown: "家族群組終結者", desc: "退群通知彈出的瞬間，全場手機同時震動。三姑六婆面面相覷，新郎默默把手機收起來。這場婚禮，將以「那場有人退群的婚禮」被記住。" };
    if (chaos >= 80) return { title: "傳說大亂鬥", crown: "婚宴失控傳說", desc: "柵欄轟然倒下！切蛋糕時全場合唱〈愛拚才會贏〉，卡拉OK 和 DJ 台合流開趴。這場婚禮將被鄉里傳頌十年。" };
    if (chaos >= 50) return { title: "混戰婚禮", crown: "火爆製造機", desc: "鐵柵欄搖搖欲墜，長輩和年輕人隔空互嗆到忘記吃菜，三叔公跟著 Lo-fi 打麻將，意外地……很歡樂？" };
    if (chaos >= 25) return { title: "和平共處", crown: "氣氛調節師", desc: "雙方達成歷史性協議：講一句地雷話就要包一個紅包。紅包雨下了一整晚，年輕人邊收邊喊「阿姨再說一句！」" };
    return { title: "尷尬收場", crown: "冷場天使", desc: "音樂停了，大家默默把菜吃完就走。新人鬆了口氣，但總覺得，這場婚禮少了點什麼。" };
  };


  /* （世界座標 WORLD 已移至模組層級） */

  const onSpotClick = (spot) => {
    if (phase !== "playing" || modal || carried) return;
    const cx = spot.x + spot.w / 2;
    if (isElder) {
      if (spot.zone === "elder" && inElderZone) {
        if (spot.id === "karaoke") walkTo(cx, singKaraoke, { toY: 0 });
        else {
          const tx = spot.id === "tea" ? cx - 62 : cx;
          walkTo(tx, () => elderZoneAct(spot.id), { toY: spot.off || 0, endFace: spot.id === "tea" ? 1 : undefined });
        }
      } else if (spot.zone === "youth") {
        if (inElderZone) walkTo(WORLD.gateX - 130, () => setModal({ type: "smuggle" }), { toY: 0 });
        else if (spot.id === "dj") walkTo(spot.x - 48, () => {
            setElderScore((s) => s + 30); addPop("+30");
            setBubble(rand(["這音樂是壞掉了是不是", "少年欸，放一首江蕙的啦", "咚滋咚滋…心臟要跟著跳出來了"])); setTimeout(() => setBubble(null), 2400);
            if (charId !== "y4" && Math.random() < 0.6) setTimeout(() => npcSay("y4", rand(["叔叔這是 Lo-fi 啦", "我找找…江蕙的沒有版權喔", "音量真的已經最小了"]), null, 3600), 1000);
          }, { endFace: 1, toY: 0 });
        else walkTo(cx, () => {
          if (spot.id === "dj") {
            setElderScore((s) => s + 30); addPop("+30");
            setBubble(rand(["這音樂是壞掉了是不是", "少年欸，放一首江蕙的啦", "咚滋咚滋…心臟要跟著跳出來了"])); setTimeout(() => setBubble(null), 2400);
            if (charId !== "y4" && Math.random() < 0.6) setTimeout(() => npcSay("y4", rand(["叔叔這是 Lo-fi 啦", "我找找…江蕙的沒有版權喔", "音量真的已經最小了"]), null, 3600), 1000);
            return;
          }
          if (spot.id === "tarot") {
            setElderScore((s) => s + 30); addPop("+30");
            setBubble(rand(["這是在拜什麼？神明有同意嗎", "水晶喔？阮以前攏叫石頭", "鼠尾草？拿去滷卡實在啦"])); setTimeout(() => setBubble(null), 2400);
            pushLed(`${me.name} 對靈性角落發表長輩看法，附近年輕人集體深呼吸`, me.id);
            return;
          }
          const lines = { candle: "燭光晚餐？電火開卡光啦", buffet: "這蝦子不錯，包一點回去", arch: "這個門做這麼小幹嘛", photo: "來，幫阿姨拍一張" };
          setBubble(lines[spot.id] || "…"); setTimeout(() => setBubble(null), 2400);
        }, { toY: spot.off || 0 });
      }
    } else {
      // 年輕人自由走動
      if (spot.id === "tarot") {
        walkTo(cx, () => {
          if (tarotCd > 0) { setBubble(`宇宙說要休息一下（${tarotCd}s）`); setTimeout(() => setBubble(null), 2100); }
          else setModal({ type: "tarot" });
        }, { toY: 128 });
        return;
      }
      if (spot.id === "dj") { walkTo(spot.x - 48, openSongModal, { endFace: 1, toY: 0 }); return; }
      walkTo(cx, () => {
        if (spot.id === "photo") { setModal({ type: "story", elder: rand(ELDERS) }); return; }
        if (spot.id === "buffet") {
          setYouthScore((s) => s + 20); addPop("+20");
          setBubble(rand(["不能吃太多，要減肥…再一隻蝦就好", "真的吃不下了啦（默默拿第三盤）"])); setTimeout(() => setBubble(null), 2400);
          return;
        }
        if (spot.id === "candle") {
          setYouthScore((s) => s + 20); addPop("+20");
          setBubble(rand(["這燈光好適合自拍", "蠟燭好香…是 Jo Malone 嗎", "好 chill 喔這個角落"])); setTimeout(() => setBubble(null), 2400);
          return;
        }
        if (spot.id === "arch") {
          setYouthScore((s) => s + 20); addPop("+20");
          setBubble(rand(["這拱門世紀美，必須拍", "乾燥花會不會掉屑啊", "在這求婚會不會太老套（偷看新人）"])); setTimeout(() => setBubble(null), 2400);
          return;
        }
      }, { toY: spot.off || 0 });
    }
  };

  const onGateClick = () => {
    if (phase !== "playing" || modal || carried) return;
    if (truceRef.current > 0) { setBubble("拍照中啦！比 YA"); setTimeout(() => setBubble(null), 2000); return; }

    if (isElder && inElderZone) walkTo(WORLD.gateX - 130, () => setModal({ type: "smuggle" }), { toY: 0 });
    else if (!isElder) walkTo(WORLD.gateX + 140, () => setModal({ type: "defend" }), { toY: 0 });
  };

  /* ============================================================
     CSS
     ============================================================ */
  const css = `
    @keyframes wbMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    @keyframes wbWalk { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-9px) rotate(2deg); } }
    @keyframes wbIdle { 0%,100% { transform: translateY(0) scale(1,1); } 50% { transform: translateY(-2px) scale(1.01,.99); } }
    @keyframes wbKick { 0%,100% { transform: rotate(6deg); } 50% { transform: rotate(-8deg); } }
    @keyframes wbFlash { 0%,100%{opacity:0} 50%{opacity:.45} }
    @keyframes wbPop { from { transform: scale(.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes wbSway { from { transform: rotate(-4deg); } to { transform: rotate(4deg); } }
    @keyframes wbTwinkle { from { opacity: .4; } to { opacity: 1; } }
    @keyframes wbBlink { 0%,100% { opacity: 1; } 50% { opacity: .15; } }
    @keyframes wbGlow { 0%,100% { filter: drop-shadow(0 0 0 rgba(255,210,80,0)); transform: translateY(0); } 50% { filter: drop-shadow(0 0 10px rgba(255,210,80,.9)); transform: translateY(-3px); } }
    @keyframes wbBounce { 0%,100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, -10px); } }
    @keyframes wbGatePulse { 0%,100% { filter: drop-shadow(0 0 4px rgba(255,210,80,.5)); } 50% { filter: drop-shadow(0 0 16px rgba(255,180,40,1)); } }
    @keyframes wbHotPulse { 0%,100% { filter: drop-shadow(0 0 2px rgba(255,200,60,.35)); } 50% { filter: drop-shadow(0 0 12px rgba(255,190,40,.95)); } }
    .wb-hot { animation: wbHotPulse 1.7s ease-in-out infinite; }
    .wb-hot:hover { animation: wbGlow .9s ease-in-out infinite; }
    @keyframes wbUnroll { 0% { transform: scaleY(.06); opacity: .4; } 100% { transform: scaleY(1); opacity: 1; } }
    @keyframes wbPopUp { 0% { transform: translate(-50%, 0); opacity: 0; } 8% { opacity: 1; } 22% { transform: translate(-50%, -148px); } 82% { transform: translate(-50%, -148px); opacity: 1; } 100% { transform: translate(-50%, -162px); opacity: 0; } }
    .wb-scorepop { position:absolute; left:50%; font-weight:900; font-size:17px; white-space:nowrap; pointer-events:none; letter-spacing:.02em; text-shadow:-2px -2px 0 #FFFDF6, 2px -2px 0 #FFFDF6, -2px 2px 0 #FFFDF6, 2px 2px 0 #FFFDF6, 0 3px 0 rgba(0,0,0,.15); animation: wbPopUp 2.8s ease-out forwards; z-index:28; }
    .wb-hint { position:absolute; top:-28px; left:50%; transform:translateX(-50%); background:#FFE6A0; color:#1d1a17; font-size:11px; font-weight:900; padding:3px 9px; border-radius:0; border:2.5px solid #1d1a17; box-shadow:2px 2px 0 #1d1a17; white-space:nowrap; pointer-events:none; }
    .wb-pop { animation: wbPop .22s ease-out; }
    .wb-portrait-fill { display:flex; align-items:center; justify-content:center; overflow:hidden; }
    .wb-portrait-fill svg { height:100%; width:auto; display:block; }
    .wb-quote-bub::before { content:""; position:absolute; left:-8px; top:50%; transform:translateY(-50%); border:7px solid transparent; border-right-color:var(--qb); }
    @keyframes wbLedIn { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .wb-ledin { animation: wbLedIn .3s steps(3) both; }
    .wb-ledblink { animation: wbBlink .8s steps(2) infinite; }
    .wb-opt { display:block; width:100%; min-height:44px; text-align:left; background:#FFF8EC; border:3px solid #1d1a17; border-radius:0; padding:8px 12px; font-weight:700; font-size:14px; color:#1d1a17; box-shadow:3px 3px 0 #1d1a17; transition:transform .08s; cursor:pointer; }
    .wb-opt:hover { transform:translate(-1px,-1px); box-shadow:4px 4px 0 #1d1a17; }
    .wb-opt:active { transform:translate(2px,2px); box-shadow:0 0 0 #1d1a17; }
    .wb-opt:focus-visible { outline:3px solid #E8B84B; outline-offset:2px; }
    @keyframes wbFlipIn { from { transform: perspective(900px) rotateY(85deg); opacity:.2; } to { transform: perspective(900px) rotateY(0deg); opacity:1; } }
    @keyframes wbFlipInR { from { transform: perspective(900px) rotateY(-85deg); opacity:.2; } to { transform: perspective(900px) rotateY(0deg); opacity:1; } }
    @keyframes wbCharFloat { 50% { transform: translateY(-4px); } }
    .wb-tchar { position:absolute; pointer-events:none; filter:drop-shadow(2px 3px 0 rgba(29,26,23,.28)); animation: wbCharFloat 3.2s ease-in-out infinite; }
    .wb-tchar svg { width:100%; height:auto; display:block; }
    @keyframes wbPkFloat { 50% { transform: translate(-50%,-6px); } }
    @media (prefers-reduced-motion: reduce) { .wb-tchar, .wb-tpk { animation: none; } }
    .wb-titleui { position:absolute; inset:0; z-index:2; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:12px; padding:0 14px calc(20px + env(safe-area-inset-bottom)); }
    .wb-pxbtn { position:relative; padding:10px 26px 12px; font-weight:900; font-size:20px; color:#fff; border:4px solid #1d1a17; border-radius:10px; letter-spacing:.25em; box-shadow:0 5px 0 #1d1a17, inset 0 -4px 0 rgba(0,0,0,.28); cursor:pointer; }
    .wb-pxbtn span { display:block; font-size:10px; letter-spacing:.3em; opacity:.85; margin-top:1px; }
    .wb-pxbtn:active { transform:translateY(4px); box-shadow:0 1px 0 #1d1a17, inset 0 -2px 0 rgba(0,0,0,.28); }
    .wb-rotate { display:none; position:fixed; inset:0; z-index:999; background:#17100a; color:#FFF8EC; flex-direction:column; align-items:center; justify-content:center; gap:18px; text-align:center; }
    @keyframes wbRotatePhone { from { transform:rotate(0deg); } to { transform:rotate(90deg); } }
    @media (orientation: portrait) and (max-width: 700px) { .wb-rotate { display:flex; } }
    .wb-portrait-hint { display:none; }
    @media (orientation: portrait) and (max-width: 560px) { .wb-portrait-hint { display:block; } }
  `;

  const C = { cream: "#FBF6EC", ink: INK, red: "#C8102E", gold: "#E8B84B", green: "#7FAF6A" };

  /*  手機直向：全畫面提示把手機橫過來（橫向或桌機自動隱藏） */
  const rotateHint = (
    <div className="wb-rotate">
      <div style={{ width: 38, height: 64, border: "4px solid #FFF8EC", borderRadius: 6, animation: "wbRotatePhone 1.4s ease-in-out infinite alternate" }} />
      <div className="font-black" style={{ fontSize: 20, letterSpacing: ".2em" }}>請把手機橫過來</div>
      <div className="text-xs font-bold opacity-70">婚禮大亂鬥是橫向遊戲</div>
    </div>
  );

  /* ============================================================
     畫面
     ============================================================ */

  if (phase === "title") {
    const startClick = () => {
      beep(880, 0.1);
      /* 手機：嘗試鎖定橫向；不支援就靠直向提示 */
      try {
        if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
          window.screen.orientation.lock("landscape").catch(() => {});
        }
      } catch (e) { /* noop */ }
      setPhase(seenIntro ? "select" : "intro");
    };
    return (
      <div className="relative overflow-hidden" style={{ height: "100dvh", minHeight: "100vh", background: "#8FD3F0", color: "#FBF6EC" }}>
        <style>{css}</style>
        {rotateHint}
        <TitleScene />
        {/* 兩邊各三名手繪角色〈〉對峙 */}
        {TITLE_CAST.map((m) => (
          <div key={m.id} className="wb-tchar" style={{
            left: `${m.cx - 4.6}%`, bottom: `${m.fy}%`, width: "9.2%", minWidth: 52,
            zIndex: Math.round(100 - m.fy), animationDelay: `${m.d}s`,
          }}>
            {/* 鏡像翻轉放在內層元素，避免跟外層 wb-tchar 的浮動動畫搶同一個 transform */}
            <div style={{ transform: m.flip ? "scaleX(-1)" : "none" }}>
              <CharSprite id={m.id} w={130} />
            </div>
          </div>
        ))}
        {/* Logo：全白、同一字型 */}
        <div className="absolute left-0 right-0 flex flex-col items-center" style={{ top: "9%", gap: 6, pointerEvents: "none" }}>
          <div className="font-black" style={{ fontSize: "clamp(10px,1.8vw,15px)", letterSpacing: ".5em", textIndent: ".5em", textShadow: `2px 0 0 ${INK}, -2px 0 0 ${INK}, 0 2px 0 ${INK}, 0 -2px 0 ${INK}, 2px 2px 0 ${INK}` }}>WEDDING BATTLE</div>
          <div style={{
            fontSize: "clamp(38px,9vw,72px)", lineHeight: 1.1, whiteSpace: "nowrap", color: "#FFF8EC",
            textShadow: `3px 0 0 ${INK}, -3px 0 0 ${INK}, 0 3px 0 ${INK}, 0 -3px 0 ${INK}, 3px 3px 0 ${INK}, -3px 3px 0 ${INK}, 3px -3px 0 ${INK}, -3px -3px 0 ${INK}, 6px 6px 0 rgba(29,26,23,.55)`,
          }}>婚禮大亂鬥</div>
        </div>
        {/* PK：柵欄下、開始鍵上 */}
        <div className="wb-tpk" style={{
          position: "absolute", left: "50%", top: "62%", transform: "translateX(-50%)",
          fontSize: "clamp(30px,8vw,64px)", lineHeight: 1, color: "#FFD500", pointerEvents: "none",
          textShadow: `3px 0 0 ${INK}, -3px 0 0 ${INK}, 0 3px 0 ${INK}, 0 -3px 0 ${INK}, 3px 3px 0 ${INK}, 6px 6px 0 rgba(29,26,23,.55)`,
          animation: "wbPkFloat 2.6s ease-in-out infinite",
        }}>PK</div>
        {/* 開始鍵：深色底淺色字、文字置中 */}
        <button onClick={startClick} className="absolute font-black" style={{
          left: "50%", bottom: "max(8%, calc(6% + env(safe-area-inset-bottom)))", transform: "translateX(-50%)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5em",
          fontSize: "clamp(15px,2.6vw,20px)", color: "#FFF8EC", background: "#2b241d",
          border: `3px solid ${INK}`, boxShadow: `0 0 0 2px #FFF8EC, 4px 4px 0 ${INK}`,
          padding: "0.55em 1.5em", minHeight: 48, cursor: "pointer", whiteSpace: "nowrap",
        }}>
          <span style={{ animation: "wbBlink 1s steps(2) infinite", lineHeight: 1 }}>▶</span>
          <span style={{ lineHeight: 1 }}>開始</span>
        </button>
        <button onClick={() => setMuted((m) => !m)} className="absolute text-xs font-black" style={{ right: 12, top: 10, textShadow: `1px 1px 0 ${INK}` }}>{muted ? "音效已關" : "音效已開"}</button>
      </div>
    );
  }

  if (phase === "intro") {
    const go = () => { setSeenIntro(true); setPhase("select"); };
    return (
      <div style={{ height: "100dvh", minHeight: "100vh", background: "#160b12" }}>
        <style>{css}</style>
        <IntroModal css={css} onStart={go} onClose={go} />
      </div>
    );
  }

  if (phase === "select") {
    const list = selFaction === "elder" ? ELDERS : YOUTHS;
    const cur = list[selIdx] || list[0];
    const isE = selFaction === "elder";
    const accent = isE ? C.red : "#37812E";
    const switchFaction = (f) => { if (f !== selFaction) { setSelFaction(f); setSelIdx(0); beep(700, 0.08); } };
    const go = (d) => { setSelIdx((i) => (i + d + list.length) % list.length); beep(880, 0.06); };
    const Pips = ({ label, val, color }) => (
      <div className="flex items-center gap-1.5">
        <span className="font-black" style={{ fontSize: 11, color: INK, background: "#FFF8EC", border: `2px solid ${INK}`, padding: "1px 6px" }}>{label}</span>
        <span className="flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => (
          <span key={i} style={{ width: 11, height: 11, border: `2px solid ${INK}`, background: i <= val ? color : "rgba(255,248,236,.25)", display: "inline-block" }} />
        ))}</span>
      </div>
    );
    const StatChip = ({ k, v }) => (
      <span className="inline-flex items-center gap-1 font-black" style={{ fontSize: 12 }}>
        <span style={{ color: "#FFF8EC", background: "rgba(29,26,23,.75)", border: `2px solid ${INK}`, padding: "1px 7px" }}>{k}</span>
        <span style={{ color: INK, background: "#FFF8EC", border: `2px solid ${INK}`, padding: "1px 8px", minWidth: 34, textAlign: "center" }}>{v * 20}</span>
      </span>
    );
    /* 橫向手機版型：整頁改成 flex-col + overflow-y:auto 兜底，
       主卡改「左立繪／右資訊」橫排，在 ~390–430px 高的橫向手機也能一屏塞下 */
    return (
      <div className="flex flex-col" style={{
        background: "#1c130c", color: "#F3E9D7", height: "100dvh", overflowY: "auto",
        padding: "8px calc(8px + env(safe-area-inset-right)) 8px calc(8px + env(safe-area-inset-left))",
      }}>
        <style>{css}</style>
        {rotateHint}

        {/* 頂列：標題＋陣營頁籤同一行，省高度 */}
        <div className="flex items-center justify-between gap-2 flex-wrap flex-shrink-0">
          <h2 className="font-black" style={{ fontSize: "clamp(14px,2.4vh,20px)", letterSpacing: ".06em" }}>選擇你的入席身份</h2>
          <div className="flex gap-1.5">
            <button className="font-black" style={{ fontSize: 12, padding: "6px 12px", background: isE ? C.red : "#2b1e15", color: isE ? "#FFF8EC" : "#C4B29A", border: `2.5px solid ${INK}`, boxShadow: isE ? `2px 2px 0 ${INK}` : "none", minHeight: 34, cursor: "pointer" }} onClick={() => switchFaction("elder")}> 長輩陣營</button>
            <button className="font-black" style={{ fontSize: 12, padding: "6px 12px", background: !isE ? "#37812E" : "#2b1e15", color: !isE ? "#FFF8EC" : "#C4B29A", border: `2.5px solid ${INK}`, boxShadow: !isE ? `2px 2px 0 ${INK}` : "none", minHeight: 34, cursor: "pointer" }} onClick={() => switchFaction("youth")}> 年輕人陣營</button>
          </div>
        </div>
        <div className="text-[10px] font-bold opacity-70 flex-shrink-0 mb-1.5">{isE ? "目標：闖過柵欄，把「關心」一句不漏講完" : "目標：守住邊界，讓每句地雷話都被回敬"}</div>

        {/* RPG 入席卡：橫排，撐滿剩餘高度 */}
        <div key={selFaction + cur.id} className="wb-pop relative flex gap-2.5 p-2.5" style={{
          flex: "1 1 auto", minHeight: 150,
          border: `4px solid ${INK}`, boxShadow: "6px 6px 0 rgba(0,0,0,.45)",
          background: isE
            ? "repeating-linear-gradient(45deg, rgba(242,178,52,.14) 0 3px, transparent 3px 16px), repeating-linear-gradient(-45deg, rgba(242,178,52,.14) 0 3px, transparent 3px 16px), linear-gradient(#9c1226, #7c0c1e)"
            : "radial-gradient(rgba(255,248,236,.5) 1.5px, transparent 1.6px), linear-gradient(#458f3a, #37812E)",
          backgroundSize: isE ? "auto" : "26px 26px, 100% 100%",
        }}>
          {/* 左：立繪佔卡片近半寬，隨畫面高度等比放大（RPG 選角常見比例） */}
          <div className="flex items-center gap-1.5 flex-shrink-0" style={{ flex: "0 1 42%", maxWidth: 260 }}>
            <button onClick={() => go(-1)} aria-label="上一位" className="font-black flex-shrink-0" style={{ width: 28, height: 28, background: "#FFF8EC", color: INK, border: `2.5px solid ${INK}`, boxShadow: `2px 2px 0 ${INK}`, fontSize: 13, cursor: "pointer" }}>◀</button>
            <div className="wb-portrait-fill flex-1 self-stretch" style={{ border: `3px solid ${INK}`, background: "rgba(23,16,10,.35)", padding: 6, minWidth: 0 }}>
              <div style={{ animation: "wbIdle 2s ease-in-out infinite", transform: isE ? "none" : "scaleX(-1)", height: "100%" }}><CharSprite id={cur.id} w={140} /></div>
            </div>
            <button onClick={() => go(1)} aria-label="下一位" className="font-black flex-shrink-0" style={{ width: 28, height: 28, background: "#FFF8EC", color: INK, border: `2.5px solid ${INK}`, boxShadow: `2px 2px 0 ${INK}`, fontSize: 13, cursor: "pointer" }}>▶</button>
          </div>

          {/* 右：台詞／數值／資訊卡靠上；入席按鈕沉到右下角，填滿卡片剩餘空間 */}
          <div className="flex-1 min-w-0 flex flex-col gap-2" style={{ justifyContent: "flex-start" }}>
            <div className="flex items-start gap-2">
              {/* 對話框：淡陣營色調＋尖角指向立繪，降低視覺重量，跟下面的資訊卡分出主次 */}
              <div className="wb-quote-bub relative flex-1 min-w-0 font-black" style={{
                "--qb": isE ? "#F2B234" : "#DCEBD8",
                background: isE ? "rgba(120,20,32,.55)" : "rgba(30,70,26,.55)",
                color: "#FFF8EC", border: `2px solid var(--qb)`, outline: `2px solid ${INK}`,
                padding: "6px 10px 6px 15px", fontSize: 13, lineHeight: 1.5,
              }}>
                {CHAR_QUOTES[cur.id]}
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <Pips label="體力" val={cur.stats.defense} color="#FF5A4E" />
                <Pips label={isE ? "話量" : "嗆力"} val={cur.stats.attack} color="#F2B234" />
              </div>
            </div>
            {/* 改用 flex justify-between，讓最後一格（跑路）跟上面的話量右緣切齊 */}
            <div className="flex justify-between gap-1.5">
              <StatChip k="嘴砲" v={cur.stats.attack} /><StatChip k="抗噪" v={cur.stats.defense} />
              <StatChip k="低調" v={cur.stats.stealth} /><StatChip k="跑路" v={cur.stats.speed} />
            </div>
            {/* 資訊卡：名字放大當標題，LV／稱號降級成小字副標，必殺技獨立一行帶標籤 */}
            <div className="px-3 py-2" style={{ background: "#FFF8EC", border: `3px solid ${INK}`, boxShadow: "inset 0 0 0 2px rgba(29,26,23,.12)" }}>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="font-black" style={{ fontSize: 19, color: accent, letterSpacing: ".02em" }}>{cur.name}</span>
                <span className="font-bold" style={{ fontSize: 10.5, color: INK, opacity: 0.6 }}>LV.{CHAR_LV[cur.id]}・{cur.specialty}</span>
              </div>
              <div className="font-black mt-1.5 flex items-start gap-1.5" style={{ fontSize: 12.5, color: INK, lineHeight: 1.5 }}>
                <span className="flex-shrink-0" style={{ background: accent, color: "#FFF8EC", fontSize: 10, padding: "1px 6px" }}>必殺</span>
                <span>{cur.skill}</span>
              </div>
            </div>
            {/* 入席按鈕：縮小、貼右下角，吃掉原本空白的區域 */}
            <button className="font-black" style={{
              alignSelf: "flex-end", marginTop: "auto", width: "52%", minWidth: 150,
              fontSize: 13, background: accent, color: "#FFF8EC", border: `3px solid ${INK}`,
              boxShadow: `0 0 0 2px #FFF8EC, 3px 3px 0 ${INK}`, padding: "8px 10px", minHeight: 40, cursor: "pointer",
            }} onClick={() => startGame(cur)}>
              入席開戰
            </button>
          </div>
        </div>

        {/* 底列：頭像列（放大，獨立一行） */}
        <div className="flex items-center gap-2 mt-1.5 flex-shrink-0">
          {list.map((c, i) => (
            <button key={c.id} onClick={() => { setSelIdx(i); beep(880, 0.06); }} aria-label={c.name}
              className="overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{
                width: 52, height: 52, background: "#FFF8EC", cursor: "pointer",
                border: `3px solid ${i === selIdx ? accent : INK}`,
                boxShadow: i === selIdx ? `0 0 0 2px ${accent}88, 3px 3px 0 ${INK}` : `3px 3px 0 ${INK}`,
                opacity: i === selIdx ? 1 : 0.6,
              }}>
              <CharSprite id={c.id} w={42} headOnly />
            </button>
          ))}
          <span className="text-xs font-bold opacity-70 ml-1">婚禮開始後陣營就鎖定了，想換邊要「再舉辦一次婚禮」</span>
        </div>
      </div>
    );
  }

  if (phase === "ending") {
    const end = getEnding();
    const stg = chaosStage(chaos);
    const topFine = Object.entries(fines).sort((a, b) => b[1] - a[1])[0];
    const receiptRows = [
      ["闖過柵欄", `×${stat.smuggle}`],
      ["攔截／防守成功", `×${stat.intercept}`],
      [isElder ? "地雷話發言" : "毒舌回嗆", `×${isElder ? spoken.length : stat.comeback}`],
      ["大聲公放送", `×${shoutUses}`],
      ["被抓包罰款", `×${stat.fined}`],
      ["交鋒最高連鎖", `×${maxCombo}`],
    ];

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: "#EFE6D4", color: C.ink, minHeight: "100dvh" }}>
        <style>{css}</style>
        {rotateHint}
        {["", "", "", "", "", ""].map((e, i) => (
          <span key={i} style={{ position: "absolute", left: `${8 + i * 16}%`, top: `${6 + (i % 3) * 9}%`, fontSize: 26 + (i % 3) * 8, animation: `wbSway ${2 + i * 0.4}s ease-in-out infinite alternate`, opacity: 0.85 }}>{e}</span>
        ))}

        <div className="wb-pop w-full max-w-md relative z-10" style={{ maxHeight: "94dvh", overflowY: "auto" }}>
          {/* 結局標題 */}
          <div className="text-center mb-3">
            <div className="inline-block mt-1 px-6 py-1.5 text-2xl font-black" style={{ background: INK, color: "#FFE6A0", border: `4px solid ${INK}`, boxShadow: `4px 4px 0 rgba(0,0,0,.3)` }}>
              {end.title}
            </div>
            <p className="text-sm leading-relaxed mt-2 font-bold px-2 opacity-85">{end.desc}</p>
          </div>

          {/*  喜宴失控結帳單 */}
          <div className="relative mx-auto mb-3" style={{ width: "min(100%, 340px)", background: "#FFFDF6", border: `3px solid ${INK}`, padding: "10px 16px 12px", boxShadow: `4px 4px 0 ${INK}` }}>
            <div className="text-center text-[10px] tracking-widest opacity-50 font-black">✂ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─</div>
            <div className="text-center text-base font-black mt-0.5"> 喜宴失控結帳單</div>
            <div className="text-center text-[9px] opacity-50 font-bold mb-2">WEDDING BATTLE・流水席帳務科</div>

            <div className="flex items-center gap-2 text-xs font-black py-1" style={{ borderBottom: `2px dotted ${INK}55` }}>
              <span className="rounded-full overflow-hidden inline-flex" style={{ width: 26, height: 26, border: `2px solid ${INK}`, background: "#fff", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {me && <CharSprite id={me.id} w={22} headOnly />}
              </span>
              <span>本場角色：{me?.name}</span>
              <span className="flex-1" />
              <span className="opacity-60">{isElder ? "長輩隊" : "年輕人隊"}</span>
            </div>

            {receiptRows.map(([label, v]) => (
              <div key={label} className="flex items-end gap-1.5 text-xs font-black py-0.5">
                <span>{label}</span>
                <span className="flex-1 mb-1" style={{ borderBottom: `2px dotted ${INK}55` }} />
                <span>{v}</span>
              </div>
            ))}
            {topFine && (
              <div className="flex items-end gap-1.5 text-xs font-black py-0.5">
                <span>罰款王：{topFine[0]}</span>
                <span className="flex-1 mb-1" style={{ borderBottom: `2px dotted ${INK}55` }} />
                <span style={{ color: C.red }}>${topFine[1]}</span>
              </div>
            )}

            {bestLine && (
              <div className="text-xs font-black mt-2 px-2 py-1.5" style={{ background: "#1d1a17", color: "#FFF8EC" }}>
                 本場最精彩的一句：<br />{bestLine.who && <span style={{ color: "#F2B234" }}>{bestLine.who}：</span>}{bestLine.text}
              </div>
            )}

            <div className="flex items-end gap-1.5 text-sm font-black pt-2 mt-1" style={{ borderTop: `2px solid ${INK}` }}>
              <span>最終火爆指數</span>
              <span className="flex-1 mb-1" style={{ borderBottom: `2px dotted ${INK}55` }} />
              <span style={{ color: C.red }}>{chaos}／100（{stg.label}）</span>
            </div>
            <div className="text-[10px] font-bold opacity-60 text-center mt-0.5">陣營統計（僅供參考）：長輩 {elderScore}・年輕人 {youthScore}</div>

            {quitGroup && (
              <div className="text-xs font-black mt-2 px-2 py-1.5" style={{ background: "#06C755", color: "#fff", border: `2.5px solid ${INK}` }}>
                 系統通知：{me?.name} 已退出「相親相愛一家人」群組
              </div>
            )}

            <div className="text-center text-[9px] opacity-50 font-bold mt-2">— 感謝惠顧・歡迎再亂 —</div>
            <div className="text-center text-[10px] tracking-widest opacity-50 font-black">─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ✂</div>
            {/* 失控稱號戳章 */}
            <div style={{ position: "absolute", right: 8, top: 12, width: 66, height: 66, border: `3.5px solid ${C.red}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: C.red, fontWeight: 900, fontSize: 11, transform: "rotate(14deg)", opacity: 0.85, background: "rgba(200,16,46,.06)", textAlign: "center", lineHeight: 1.3, padding: 4 }}>{end.crown}</div>
          </div>

          <div className="flex flex-wrap justify-center gap-1.5 mb-4 px-2">
            {[["", `闖關 ${stat.smuggle}`], ["", `攔截 ${stat.intercept}`], ["", `回嗆 ${stat.comeback}`], ["", `連鎖 ${maxCombo}`], ["", `大聲公 ${shoutUses}`]].map(([ic, t], i) => (
              <span key={i} className="px-2 py-0.5 text-[11px] font-black" style={{ background: ["#FFE6A0", "#DCEBD8", "#F6D9D2", "#EBD9F2"][i % 4], border: `2.5px solid ${INK}`, boxShadow: `1.5px 1.5px 0 ${INK}` }}>
                {ic} {t}
              </span>
            ))}
          </div>

          <div className="text-center pb-2">
            <button className="wb-opt" style={{ width: "auto", display: "inline-block", background: INK, color: "#FFE6A0", fontSize: 16, minHeight: 44 }} onClick={resetGame}> 再舉辦一次婚禮</button>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     主遊戲畫面（橫向捲軸世界）
     ============================================================ */

  /*  焦點制提示：同一時間只有「離玩家最近的可互動目標」浮出名牌／發光，
     其餘一律安靜——裝飾永遠不亮，會亮的就是能點的（計畫書第四節互動原則） */
  const FOCUS_RANGE = 300;
  const focusCandidates = [];
  if (!modal && !carried) {
    WORLD.spots.forEach((s) => {
      const interactive =
        (isElder && ((s.zone === "elder" && inElderZone) || s.zone === "youth")) ||
        (!isElder && s.zone === "youth");
      if (interactive) focusCandidates.push({ id: s.id, x: s.x + s.w / 2 });
    });
    if (isElder && inElderZone) focusCandidates.push({ id: "npc-e1", x: 332 }, { id: "npc-e2", x: 671 });
    if (isElder && !inElderZone) focusCandidates.push({ id: "npc-y1", x: 1145 }, { id: "npc-y2", x: 1409 }, { id: "npc-y3", x: 1844 });
    if (!isElder) focusCandidates.push({ id: "npc-y1", x: 1145 }, { id: "npc-y2", x: 1409 }, { id: "npc-y3", x: 1844 }, { id: "npc-y4", x: 1572 });
    if ((isElder && inElderZone) || !isElder) focusCandidates.push({ id: "gate", x: WORLD.gateX });
    focusCandidates.push({ id: "couple", x: 1958 });
  }
  let focusId = null;
  {
    let best = FOCUS_RANGE;
    for (const c of focusCandidates) {
      const d = Math.abs(c.x - px);
      if (d < best) { best = d; focusId = c.id; }
    }
  }
  /* 可疑長輩是限時事件目標，靠近時優先鎖定 */
  if (!isElder && lurker && !modal && !carried && Math.abs(lurker.x + 30 - px) < FOCUS_RANGE) focusId = "lurker";

  return (
    <div className="flex flex-col overflow-hidden" style={{ background: "#BFE3D0", color: C.ink, height: "100dvh", minHeight: "100vh", maxHeight: "100dvh", paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}>
      <style>{css}</style>
      {rotateHint}

      {flash && <div className="fixed inset-0 z-50 pointer-events-none" style={{ background: C.red, animation: "wbFlash .3s ease-in-out 3" }} />}
      {photoFlash && <div className="fixed inset-0 z-50 pointer-events-none" style={{ background: "#fff", animation: "wbFlash .45s ease-in-out 1" }} />}

      {/* LED 跑馬燈 */}
      <div className="px-2 pt-1 relative">
        <Marquee led={led} />
      </div>

      {/* HUD：現場火爆指數（主要進度）＋倒數＋資源 */}
      <div className="px-2 py-1 flex flex-wrap items-center gap-1.5 text-xs font-black">
        <div className="flex items-center gap-1.5" style={{ minWidth: 160, flex: "1 1 160px", maxWidth: 300 }}>
          <span style={{ color: INK, whiteSpace: "nowrap" }}>火爆</span>
          <div style={{ flex: 1, height: 13, border: `2px solid ${INK}`, background: "rgba(255,253,246,.6)", display: "flex", gap: 2, padding: 2 }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} style={{ flex: 1, background: i < Math.round(chaos / 5) ? (i >= 16 ? "#F2B234" : i >= 10 ? "#E5304C" : i >= 5 ? "#E08A3C" : "#E8C84F") : "transparent" }} />
            ))}
          </div>
          <span className="px-1 py-0.5" style={{ background: chaosStage(chaos).color, border: `2px solid ${INK}`, color: INK, whiteSpace: "nowrap" }}>{chaosStage(chaos).label}·{chaos}</span>
        </div>
        <span className="px-2 py-0.5" style={{ background: "rgba(29,26,23,.85)", color: "#fff", border: `2px solid ${INK}` }}>{fmt(timeLeft)}</span>
        {isElder && <span className="px-2 py-0.5" style={{ background: "rgba(232,184,75,.92)", border: `2px solid ${INK}` }}>${wallet}</span>}
        {!isElder && combo > 0 && <span className="px-2 py-0.5" style={{ background: "rgba(122,58,142,.9)", color: "#fff", border: `2px solid ${INK}` }}>連鎖{combo}</span>}
        <span className="flex-1" />
        <button onClick={() => setMuted((m) => !m)} aria-label="切換音效">{muted ? "" : ""}</button>
      </div>

      {truce > 0 && (
        <div className="mx-3 mb-1 text-center font-black text-sm rounded-xl py-1.5 px-2" style={{ background: "#FFE6A0", border: `3px solid ${INK}`, boxShadow: `2px 2px 0 ${INK}`, color: INK }}>
           大合照中 {truce}s — 全場暫時和好！耶
        </div>
      )}

      {/* ===== 世界 ===== */}
      <div ref={worldRef} className="flex-1 overflow-x-auto overflow-y-hidden relative" style={{ scrollbarWidth: "thin" }}>
        <div className="relative h-full" style={{ width: WORLD.width, minHeight: 360, zoom: worldScale }} onClick={onGroundClick}>

          {/* 天空與樹林 */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,#C2E4D8 0%,#DCEFD0 48%,#9CC07A 48.5%,#8AB46A 100%)" }} />
          <svg className="absolute" style={{ top: "16%", left: 0, width: "100%", height: 110 }} viewBox="0 0 2080 110" preserveAspectRatio="none">
            {Array.from({ length: 22 }).map((_, i) => (
              <g key={i}>
                <circle cx={50 + i * 98} cy={i % 2 ? 62 : 50} r={i % 3 ? 36 : 46} fill={i % 2 ? "#6E9C55" : "#7FAF6A"} />
              </g>
            ))}
            <rect x={0} y={92} width={2080} height={20} fill="#7FAF6A" />
          </svg>

          {/* 長輩區紅棚 */}
          <div className="absolute" style={{ left: 0, top: 0, width: WORLD.gateX - 115, height: "46%" }}>
            <svg width="100%" height="100%" viewBox="0 0 790 200" preserveAspectRatio="none">
              <rect x={0} y={0} width={790} height={120} fill="#A8232E" />
              <rect x={0} y={0} width={790} height={120} fill="url(#none)" />
              {Array.from({ length: 14 }).map((_, i) => (
                <path key={i} d={`M ${i * 58} 120 q 29 26 58 0 Z`} fill={i % 2 ? "#C8413A" : "#E8B84B"} stroke={INK} strokeWidth={2} />
              ))}
              <text x={395} y={70} textAnchor="middle" fontSize={34} fontWeight={900} fill="#FFE6A0" stroke={INK} strokeWidth={1}> 長 輩 區 </text>
            </svg>
            <LanternRow n={5} />
          </div>
          {/* 長輩區紅地毯 */}
          <div className="absolute" style={{ left: 0, bottom: 0, width: WORLD.gateX, height: "30%", background: "repeating-linear-gradient(90deg,#B23A36 0 60px,#A8302C 60px 120px)", borderTop: `4px solid ${INK}` }} />

          {/* 年輕人區木棧板 + 燈串 */}
          <div className="absolute" style={{ left: WORLD.gateX, bottom: 0, width: WORLD.width - WORLD.gateX, height: "30%", background: "repeating-linear-gradient(90deg,#C9A36E 0 70px,#BD9560 70px 140px)", borderTop: `4px solid ${INK}` }} />
          <div className="absolute" style={{ left: WORLD.gateX + 20, top: "6%", width: WORLD.width - WORLD.gateX - 60, height: 44 }}>
            <StringLights />
          </div>
          <div className="absolute font-black" style={{ left: WORLD.gateX + 60, top: "13%", fontSize: 26, color: "#7A5C44", textShadow: "2px 2px 0 #fff" }}>✿ 年 輕 人 區 ✿</div>

          {/* 場景物件 */}
          {WORLD.spots.map((s) => {
            const interactive =
              (isElder && ((s.zone === "elder" && inElderZone) || s.zone === "youth")) ||
              (!isElder && s.zone === "youth");
            /* 發光＝主要玩法；其餘可點擺設靠名牌辨識 */
            const actionable =
              (isElder && inElderZone && s.id === "karaoke") ||
              (!isElder && (s.id === "dj" || s.id === "photo" || s.id === "tarot"));
            const focused = focusId === s.id;
            return (
              <Prop key={s.id} x={s.x} y={(s.off || 0) + 36} w={s.w} h={s.h}
                onClick={interactive ? () => onSpotClick(s) : undefined}
                hot={actionable && focused}
                label={s.label}
                tag={focused && !(actionable && s.label) ? SPOT_TAGS[s.id] : undefined}>
                <s.Comp />
              </Prop>
            );
          })}

          {/* NPC：長輩們坐沙發/打麻將 */}
          {charId !== "e1" && <NPCSprite id="e1" x={300} y={96} w={64} flip dance={elderChoir} react={npcReact && npcReact.id === "e1" ? npcReact : null} hot={focusId === "npc-e1"} onClick={isElder && inElderZone ? () => approachNpc(332, () => { setBubble("英珠啊，呷飽未？"); setTimeout(() => setBubble(null), 2000); }) : undefined} />}
          {charId !== "e2" && <NPCSprite id="e2" x={640} y={120} w={62} dance={elderChoir} react={npcReact && npcReact.id === "e2" ? npcReact : null} hot={focusId === "npc-e2"} onClick={isElder && inElderZone ? () => approachNpc(671, () => { setBubble("水泉伯，茶好喝嗎？"); setTimeout(() => setBubble(null), 2000); }) : undefined} />}
          {charId !== "e3" && <NPCSprite id="e3" x={455} y={160} w={58} dance={elderChoir} react={npcReact && npcReact.id === "e3" ? npcReact : null} />}
          {charId !== "e4" && <NPCSprite id="e4" x={386} y={40} w={64} flip dance={elderChoir} react={npcReact && npcReact.id === "e4" ? npcReact : null} />}
          {/* NPC：年輕人（搭話統一點人，不點桌子） */}
          {charId !== "y1" && <NPCSprite id="y1" x={1115} y={42} w={60} flip dance={youthParty} react={npcReact && npcReact.id === "y1" ? npcReact : null} onClick={isElder && !inElderZone ? () => approachNpc(1145, () => openTalk("y1")) : !isElder ? () => approachNpc(1145, () => peerChat("y1")) : undefined} hot={focusId === "npc-y1"} />}
          {charId !== "y2" && <NPCSprite id="y2" x={1378} y={42} w={62} dance={youthParty} react={npcReact && npcReact.id === "y2" ? npcReact : null} onClick={isElder && !inElderZone ? () => approachNpc(1409, () => openTalk("y2")) : !isElder ? () => approachNpc(1409, () => peerChat("y2")) : undefined} hot={focusId === "npc-y2"} />}
          {charId !== "y3" && <NPCSprite id="y3" x={1812} y={38} w={60} flip dance={youthParty} react={npcReact && npcReact.id === "y3" ? npcReact : null} onClick={isElder && !inElderZone ? () => approachNpc(1844, () => openTalk("y3")) : !isElder ? () => approachNpc(1844, () => peerChat("y3")) : undefined} hot={focusId === "npc-y3"} />}
          {charId !== "y4" && <NPCSprite id="y4" x={1604} y={40} w={62} dance react={npcReact && npcReact.id === "y4" ? npcReact : null} hot={focusId === "npc-y4"} onClick={!isElder ? () => approachNpc(1572, () => peerChat("y4")) : undefined} />}
          {/*  卡拉OK 播放中字幕 */}
          {nowPlaying && (
            <div className="wb-pop" style={{ position: "absolute", left: 70, bottom: 235, zIndex: 15, background: "#1d1a17", color: "#FFE6A0", border: `3px solid ${INK}`, borderRadius: 12, padding: "3px 10px", fontSize: 11, fontWeight: 900, boxShadow: `2px 2px 0 ${INK}`, animation: "wbSway 1.4s ease-in-out infinite alternate" }}>
              ♪ 播放中：《{nowPlaying}》
            </div>
          )}
          {/*  合唱/蓋台音符特效 */}
          {elderChoir && <div style={{ position: "absolute", left: 130, bottom: 200, fontSize: 30, animation: "wbIdle .6s ease-in-out infinite", zIndex: 15 }}></div>}
          {youthParty && <div style={{ position: "absolute", left: 1450, bottom: 170, fontSize: 30, animation: "wbIdle .6s ease-in-out infinite", zIndex: 15 }}></div>}

          {/*  新郎新娘（象徵性無臉設計）：點擊敬酒 */}
          <CoupleSprite x={1928} y={40} hot={focusId === "couple"}
            cdLabel={toastCd > 0 ? `${toastCd}s` : "向新人敬酒"}
            onClick={() => {
              if (phase !== "playing" || modal || carried) return;
              if (isElder && inElderZone) walkTo(WORLD.gateX - 130, () => setModal({ type: "smuggle" }));
              else approachNpc(1986, doToast);
            }} />
          {/*  可疑長輩（年輕人限定攻擊目標） */}
          {!isElder && lurker && (
            <div className={`${focusId === "lurker" ? "wb-hot " : ""}wb-stop`} onClick={() => {
              if (phase !== "playing" || modal || carried) return;
              if (truceRef.current > 0) { setBubble("拍照中啦！比 YA"); setTimeout(() => setBubble(null), 2000); return; }
              approachNpc(lurker.x + 30, openSchmooze);
            }} style={{ position: "absolute", left: lurker.x, bottom: 38, zIndex: npcReact && npcReact.id === "visitor" ? 30 : 11, cursor: "pointer" }}>
              {npcReact && npcReact.id === "visitor" && (
                <div className="wb-pop" style={{ position: "absolute", bottom: "calc(100% + 9px)", left: "50%", transform: "translateX(-50%)", background: "#fff", border: `3px solid ${INK}`, borderRadius: 0, padding: "3px 8px", fontWeight: 900, fontSize: 11, boxShadow: `2px 2px 0 ${INK}`, zIndex: 32, width: "max-content", maxWidth: 150, textAlign: "left", lineHeight: 1.35 }}>
                  {npcReact.text}
                </div>
              )}
              <div style={{ animation: npcReact && npcReact.id === "visitor" && npcReact.expr ? "wbKick .3s linear 5" : "wbIdle 1.4s ease-in-out infinite", transform: "scale(.94)", transformOrigin: "bottom center", filter: "drop-shadow(0 3px 2px rgba(0,0,0,.2))" }}>
                <CharSprite id={lurker.elder.id} w={60} expression={npcReact && npcReact.id === "visitor" && npcReact.expr ? npcReact.expr : "idle"} />
              </div>
              <div style={{ position: "absolute", top: -6, right: -4, fontSize: 16 }}></div>
              {focusId === "lurker" && <div className="wb-hint"> 可疑長輩・搭話陰他</div>}
            </div>
          )}

          {/* ===== 邊界檢查哨（大門） ===== */}
          <div className="absolute wb-stop" style={{ left: WORLD.gateX - 95, bottom: 30, width: 190, height: 330, cursor: "pointer", zIndex: 12 }} onClick={onGateClick}>
            {/* 彈跳箭頭提示：只在柵欄成為焦點時出現 */}
            {focusId === "gate" && <div style={{
              position: "absolute", top: -22, left: "50%",
              animation: "wbBounce 1s ease-in-out infinite",
              background: isElder && inElderZone ? "#C8102E" : "#3E7C6E", color: "#fff",
              border: `2.5px solid ${INK}`, borderRadius: 12, padding: "3px 10px",
              fontWeight: 900, fontSize: 12, whiteSpace: "nowrap", boxShadow: `2px 2px 0 ${INK}`, zIndex: 15,
            }}>
              {isElder && inElderZone ? "查看闖關任務" : !isElder ? "守備柵欄" : "邊界大門"}
            </div>}
            <svg width="190" height="330" viewBox="0 0 190 330">
              {/* 左右鐵柵欄延伸 */}
              {[6, 20, 34].map((x) => <rect key={`l${x}`} x={x} y={96} width={6} height={234} fill="#6A6A75" stroke={INK} strokeWidth={2} />)}
              {[150, 164, 178].map((x) => <rect key={`r${x}`} x={x} y={96} width={6} height={234} fill="#6A6A75" stroke={INK} strokeWidth={2} />)}
              <rect x={0} y={112} width={190} height={8} fill="#55555F" stroke={INK} strokeWidth={2} />
              <rect x={0} y={268} width={190} height={8} fill="#55555F" stroke={INK} strokeWidth={2} />
              {/* 紅白警示柱 ×2 */}
              {[48, 128].map((x) => (
                <g key={x}>
                  <rect x={x} y={92} width={14} height={238} fill="#fff" stroke={INK} strokeWidth={3.5} />
                  {[100, 136, 172, 208, 244, 280].map((y, i) => i % 2 === 0 && <rect key={y} x={x + 1.5} y={y} width={11} height={22} fill="#C8102E" />)}
                  <circle cx={x + 7} cy={88} r={8} fill="#E8B84B" stroke={INK} strokeWidth={3} />
                </g>
              ))}
              {/* 門楣（招牌直接畫在上面） */}
              <rect x={32} y={56} width={126} height={32} rx={7} fill="#8E2424" stroke={INK} strokeWidth={4} />
              <text x={95} y={78} textAnchor="middle" fontSize={16} fontWeight={900} fill="#FFE6A0"> 邊界檢查哨 </text>
              {/* 警示燈 */}
              <rect x={86} y={36} width={18} height={14} fill="#444" stroke={INK} strokeWidth={3} />
              <circle cx={95} cy={26} r={12} fill={alert_ ? "#FF2A1A" : "#5A1212"} stroke={INK} strokeWidth={3.5} style={alert_ ? { animation: "wbBlink .4s linear infinite" } : {}} />
              {alert_ && <g opacity={0.7}><path d="M 76 18 L 64 10 M 114 18 L 126 10 M 95 10 L 95 0" stroke="#FF2A1A" strokeWidth={4} strokeLinecap="round" /></g>}
              {/* 金框紅色雙開大門（互動時發光脈動） */}
              <g style={focusId === "gate" ? { animation: "wbGatePulse 1.6s ease-in-out infinite" } : {}}>
                <rect x={56} y={92} width={78} height={238} rx={6} fill="#E8B84B" stroke={INK} strokeWidth={4.5} />
                <rect x={63} y={100} width={30} height={222} rx={4} fill="#C8413A" stroke={INK} strokeWidth={3.5} />
                <rect x={97} y={100} width={30} height={222} rx={4} fill="#C8413A" stroke={INK} strokeWidth={3.5} />
                {/* 門板格線 + 金釘 */}
                {[63, 97].map((dx) => (
                  <g key={dx}>
                    <line x1={dx + 4} y1={160} x2={dx + 26} y2={160} stroke={INK} strokeWidth={2} opacity={.5} />
                    <line x1={dx + 4} y1={250} x2={dx + 26} y2={250} stroke={INK} strokeWidth={2} opacity={.5} />
                    {[118, 200, 290].map((y) => <circle key={y} cx={dx + 15} cy={y} r={3} fill="#E8B84B" stroke={INK} strokeWidth={1.5} />)}
                  </g>
                ))}
                {/* 大門把手 */}
                <circle cx={88} cy={212} r={6.5} fill="#E8B84B" stroke={INK} strokeWidth={3} />
                <circle cx={102} cy={212} r={6.5} fill="#E8B84B" stroke={INK} strokeWidth={3} />
              </g>
            </svg>
          </div>
          <NPCSprite id="guard" x={WORLD.gateX + 104} y={36} w={70} />
          <NPCSprite id="guard" x={WORLD.gateX - 168} y={36} w={70} flip />

          {/* ===== 玩家角色 ===== */}
          <div style={{
            position: "absolute", bottom: 40 + py, left: px,
            transition: `left ${walkDur}ms linear, bottom ${walkDur}ms linear`,
            zIndex: py > 50 ? 9 : 20, width: 96, marginLeft: -48,
            transform: `scale(${1 - py * 0.0012})`, transformOrigin: "bottom center",
          }}>
            {/* 氣泡 */}
            {bubble && (
              <div className="wb-pop" style={{
                position: "absolute", bottom: "108%", left: "50%", transform: "translateX(-50%)",
                background: "#fff", border: `3.5px solid ${INK}`, borderRadius: 0,
                padding: "6px 10px", fontWeight: 900, fontSize: 13, whiteSpace: "nowrap", boxShadow: `3px 3px 0 ${INK}`, zIndex: 45,
              }}>{bubble}</div>
            )}
            {/* 保鏢左右夾 */}
            {pops.map((p, i) => (
              <div key={p.id} className="wb-scorepop" style={{ color: p.color, bottom: 112 + i * 26 }}>{p.text}</div>
            ))}
            {npcReact && npcReact.id === "foe" && (
              <div className="wb-pop" style={{ position: "absolute", left: facing === 1 ? 152 : -152, bottom: 0, zIndex: 27 }}>
                {npcReact.text && (
                  <div className="wb-pop" style={{ position: "absolute", bottom: "calc(100% + 9px)", left: "50%", transform: "translateX(-50%)", background: "#fff", border: `3px solid ${INK}`, borderRadius: 0, padding: "3px 8px", fontWeight: 900, fontSize: 11, boxShadow: `2px 2px 0 ${INK}`, zIndex: 32, width: "max-content", maxWidth: 150, textAlign: "left", lineHeight: 1.35 }}>
                    {npcReact.text}
                  </div>
                )}
                <div style={{ transform: facing === 1 ? "scaleX(-1)" : "none", animation: npcReact.expr === "dead" ? "none" : npcReact.expr ? "wbKick .3s linear 5" : "wbIdle 1.6s ease-in-out infinite", transformOrigin: "bottom center", filter: npcReact.expr === "dead" ? "grayscale(.7) drop-shadow(0 3px 2px rgba(0,0,0,.2))" : "drop-shadow(0 3px 2px rgba(0,0,0,.2))" }}>
                  <CharSprite id={npcReact.elder} w={78} expression={npcReact.expr || "idle"} />
                </div>
                {npcReact.expr === "dead" && (
                  <div style={{ position: "absolute", top: -26, left: "50%", transform: "translateX(-50%)", fontSize: 22, animation: "wbBounce 1.4s ease-in-out infinite" }}></div>
                )}
              </div>
            )}
            {carried && <>
              <div style={{ position: "absolute", left: -54, bottom: 0 }}><CharSprite id="guard" w={66} /></div>
              <div style={{ position: "absolute", right: -54, bottom: 0, transform: "scaleX(-1)" }}><CharSprite id="guard" w={66} /></div>
            </>}
            <div style={{
              transform: `scaleX(${facing}) ${sneaking ? "scale(.88) translateY(6px)" : ""}`,
              animation: carried ? "wbKick .35s linear infinite" : walking ? "wbWalk .32s linear infinite" : "wbIdle 2s ease-in-out infinite",
              transformOrigin: "bottom center",
              filter: "drop-shadow(0 4px 3px rgba(0,0,0,.25))",
            }}>
              {me && <CharSprite id={me.id} w={92} expression={expr} disguise={disguised} />}
            </div>
            {sneaking && <div style={{ position: "absolute", top: -8, right: 4, fontSize: 18 }}></div>}
            <div style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)", width: 64, height: 12, background: "rgba(0,0,0,.18)", borderRadius: "50%" }} />
          </div>
        </div>
      </div>

      {/*  大聲公鈕（雙陣營可用，每場限 SHOUT_LIMIT 次） */}
      {phase === "playing" && !modal && !carried && shoutUses < SHOUT_LIMIT && (
        <button onClick={() => { if (shoutCd <= 0) setModal({ type: "shout" }); }}
          className="fixed font-black wb-pop" disabled={shoutCd > 0}
          style={{ right: "max(14px, env(safe-area-inset-right))", bottom: 86, zIndex: 35, minWidth: 54, height: 54, background: shoutCd > 0 ? "#C9BFA8" : "#FFE6A0", color: INK, border: `3.5px solid ${INK}`, borderRadius: "50%", fontSize: shoutCd > 0 ? 16 : 22, boxShadow: `3px 3px 0 ${INK}`, opacity: shoutCd > 0 ? 0.55 : 1, display: "flex", alignItems: "center", justifyContent: "center", animation: "none" }}>
          {shoutCd > 0 ? shoutCd : `${SHOUT_LIMIT - shoutUses}`}
        </button>
      )}

      {/*  退出家庭群組（年輕人・火爆 80 以上解鎖的大招） */}
      {phase === "playing" && !modal && !carried && !isElder && chaos >= 80 && !quitGroup && (
        <button onClick={() => setModal({ type: "quitgroup" })}
          className="fixed font-black wb-pop"
          style={{ right: "max(14px, env(safe-area-inset-right))", bottom: 150, zIndex: 35, background: "#1d1a17", color: "#FFE6A0", border: `3.5px solid ${INK}`, boxShadow: `0 0 0 2px #FFE6A0, 3px 3px 0 ${INK}`, padding: "10px 14px", fontSize: 13, animation: "wbHotPulse 1.2s ease-in-out infinite" }}>
           退出家庭群組
        </button>
      )}

      {/* ===== 固定式 RPG 對話框：角色對話與行動結果都走這裡，按一下才前進 ===== */}
      {dlg && dlg.lines[dlg.idx] && (() => {
        const L = dlg.lines[dlg.idx];
        const last = dlg.idx === dlg.lines.length - 1;
        const sideColor = L.side === "elder" ? C.red : L.side === "youth" ? "#37812E" : "#4A4038";
        return (
          <div className="fixed inset-x-0 bottom-0 z-40" onClick={advanceDlg}
            style={{ padding: "0 calc(6px + env(safe-area-inset-right)) calc(6px + env(safe-area-inset-bottom)) calc(6px + env(safe-area-inset-left))", cursor: "pointer" }}>
            <div className="relative w-full max-w-3xl mx-auto" style={{
              background: "rgba(23,16,10,.97)", border: "3px solid #FFF8EC",
              boxShadow: `0 0 0 3px ${INK}`, padding: "14px 16px 12px",
            }}>
              {L.who && (
                <span className="absolute font-black" style={{
                  top: 0, left: 12, transform: "translateY(-55%)", background: sideColor,
                  color: "#FFF8EC", border: `2px solid ${INK}`, padding: "2px 10px", fontSize: 13,
                }}>{L.who}</span>
              )}
              <div className="flex items-center gap-3">
                {L.sprite && (
                  <div className="flex-shrink-0" style={{ width: 46 }}>
                    <CharSprite id={L.sprite} w={46} expression={L.expr || "idle"} headOnly />
                  </div>
                )}
                <div className="font-black flex-1 min-w-0" style={{ fontSize: 15, lineHeight: 1.65, color: "#FBF6EC" }}>
                  {L.text}
                </div>
              </div>
              <span className="absolute font-black" style={{ right: 12, bottom: 6, fontSize: 13, color: C.gold, animation: "wbBlink 1s steps(2) infinite" }}>
                {last ? "點一下結束" : "點一下繼續"}
              </span>
            </div>
          </div>
        );
      })()}

      {/* 底部任務欄（含大頭照，單行精簡提示） */}
      <div className="px-2 py-1 flex items-center gap-2" style={{ background: "rgba(29,26,23,.88)", color: "#FBF6EC", paddingBottom: "max(4px, env(safe-area-inset-bottom))" }}>
        <div className="rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ width: 30, height: 30, background: "#FBF6EC", border: `2.5px solid ${C.gold}` }}>
          {me && <CharSprite id={me.id} w={24} headOnly />}
        </div>
        <div className="text-xs font-bold leading-snug min-w-0" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <span style={{ color: C.gold }}>{me?.name}</span>
          <span className="opacity-90">：{isElder
            ? inElderZone ? "點年輕人區東西或大門闖關偷渡！"
              : `搭話講地雷話（已講 ${spoken.length}/${MINE_PHRASES.length}）`
            : "點可疑長輩／警報攔截／柵欄設防"}</span>
        </div>
      </div>

      {/* ===== 彈窗（漫畫風面板） ===== */}
      {modal && (
        <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: "rgba(29,26,23,.45)", padding: "8px calc(8px + env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) calc(8px + env(safe-area-inset-left))" }}>
          <div className="wb-pop w-full max-w-xl p-4" style={{ background: "rgba(23,16,10,.97)", border: "3px solid #FFF8EC", boxShadow: `0 0 0 3px ${INK}, inset 0 0 0 2px ${INK}`, color: "#FBF6EC", maxHeight: "78dvh", overflowY: "auto" }}>

            {modal.type === "talk" && (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <CharSprite id={modal.npc.id} w={56} />
                  <div className="font-black text-sm">{modal.npc.name}抬頭看著你…<br /><span className="text-xs opacity-60 font-bold">（講出口才知道場面會多精彩。被抓只罰錢，被架走再回來闖就好）</span></div>
                </div>
                <div className="grid gap-2">
                  {modal.mines.map((p) => (
                    <button key={p.id} className="wb-opt" onClick={() => speak(p)}>
                      「{p.text}」<br /><span className="opacity-60 text-xs">{p.category}</span>
                    </button>
                  ))}
                  <button className="wb-opt" style={{ background: "#E8E0D2" }} onClick={() => speak(null)}>「{modal.safe}」（場面話）</button>
                </div>
              </>
            )}

            {modal.type === "smuggle" && (
              <>
                <h3 className="font-black mb-1"> 查看闖關任務 — 選擇路線</h3>
                <p className="text-xs opacity-70 mb-3 font-bold">闖過柵欄就能去年輕人區「關心」大家。被抓不算輸，回來再闖！</p>
                {/* 賄賂／餐車／節奏／誘餌路線程式保留，本版先隱藏（選項上限 3） */}
                <div className="grid gap-2">
                  <button className="wb-opt" onClick={() => startSmuggle("quiz")}> 正面硬闖 — 回答守門人的年齡驗證題</button>
                  <button className="wb-opt" onClick={() => startSmuggle("disguise")}> 偽裝潛入 — 換上年輕人的衣服</button>
                  <button className="wb-opt" onClick={() => startSmuggle("climb")}> 翻牆偷渡 — 快速連點翻過柵欄</button>
                  <button className="wb-opt" style={{ background: "#E8E0D2" }} onClick={() => setModal(null)}>先不要好了…</button>
                </div>
              </>
            )}

            {modal.type === "quiz" && (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <CharSprite id="guard" w={56} />
                  <div className="font-black text-sm">「不好意思，年齡驗證：<br />{modal.q.q}」</div>
                </div>
                <div className="grid gap-2">
                  {modal.q.options.map((o, i) => (
                    <button key={i} className="wb-opt" onClick={() => i === modal.q.ans ? smuggleSuccess("通過年齡驗證") : smuggleFail("驗證失敗")}>{o}</button>
                  ))}
                </div>
              </>
            )}

            {modal.type === "disguise" && (
              <>
                <h3 className="font-black mb-1"> 偽裝潛入 — 選一套穿搭</h3>
                <p className="text-xs opacity-70 mb-3 font-bold">哪一套最像年輕人？</p>
                <div className="grid grid-cols-2 gap-2">
                  {modal.options.map((o, i) => (
                    <button key={i} className="wb-opt" onClick={() => o.ok ? (Math.random() < 0.85 ? (setDisguised(true), smuggleSuccess("成功偽裝成年輕人")) : smuggleFail("帽T 底下露出保溫杯")) : smuggleFail(`穿「${o.label}」一秒被識破`)}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {modal.type === "climb" && <ClimbGame charId={charId} onWin={() => smuggleSuccess("身手矯健翻過鐵柵欄")} onLose={() => smuggleFail("摔個四腳朝天，被保鏢抬下來（沙隆巴斯自費）")} />}
            {modal.type === "steps" && <StepGame onWin={() => smuggleSuccess("踏出正確節奏，密道地板翻轉把人送進年輕人區")} onLose={() => smuggleFail("踏錯節奏機關卡住，被保鏢從地道拖出來")} />}
            {modal.type === "cart" && <CartGame onWin={() => smuggleSuccess("藏在餐車裡（致敬 Metal Gear ）")} onLose={() => smuggleFail("掀餐車布的瞬間跟服務生對到眼")} />}

            {modal.type === "verify" && (
              <>
                <h3 className="font-black mb-1 flex items-center justify-between"> 誰是偽裝的長輩？
                  <span style={{ color: "#C8102E", fontSize: 18 }}> {(modal.left ?? 6).toFixed(1)}s</span></h3>
                <div className="h-2 mb-2 overflow-hidden" style={{ background: "#E8E0D2", border: `2.5px solid ${INK}`, borderRadius: 8 }}>
                  <div className="h-full" style={{ width: `${((modal.left ?? 6) / 6) * 100}%`, background: (modal.left ?? 6) < 2 ? "#C8102E" : "#E8B84B", transition: "width .1s linear" }} />
                </div>
                <p className="text-xs opacity-70 mb-3 font-bold">這次全部的人都戴帽子裝年輕！看臉、看細節線索。抓錯或猶豫超時，長輩就混進來了。</p>
                <div className="grid gap-2">
                  {modal.people.map((p, i) => (
                    <button key={i} className="wb-opt" style={{ display: "flex", alignItems: "center", gap: 10 }} onClick={() => { if (tarotFx === "wheel") setTarotFx(null); pickVerify(p); }}>
                      <span className="relative inline-flex"><CharSprite id={p.sprite.id} w={36} disguise={p.sprite.disguise} />{tarotFx === "wheel" && p.isElder && <span style={{ position: "absolute", top: -4, right: -8, fontSize: 16 }}></span>}</span>
                      <span>{p.label}{tarotFx === "wheel" && p.isElder ? "（在冒汗…）" : ""}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {modal.type === "shame" && (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div style={{ transform: "rotate(8deg)" }}><CharSprite id={modal.elder.id} w={62} expression="shock" /></div>
                  <div className="font-black text-sm"> 攔截成功！{modal.elder.name} 被押回長輩區。<br />要順便上 LED 公審嗎？</div>
                </div>
                <div className="flex gap-2">
                  <button className="wb-opt" style={{ background: "#F6D9D2", width: "auto" }} onClick={() => publicShame(modal.elder)}> 公審！（+100）</button>
                  <button className="wb-opt" style={{ background: "#E8E0D2", width: "auto" }} onClick={() => setModal(null)}>放他一馬</button>
                </div>
              </>
            )}

            {modal.type === "shout" && (
              <>
                <h3 className="font-black mb-1"> 大聲公 — 全場都會聽見</h3>
                <p className="text-xs opacity-70 mb-3 font-bold">選一句嗆出去：跑馬燈全場重播、對面一定有反應、火爆指數 +{CHAOS.shout}。每場限 {SHOUT_LIMIT} 次（剩 {SHOUT_LIMIT - shoutUses} 次）。</p>
                <div className="grid gap-2">
                  {sample(isElder ? ELDER_SHOUTS : YOUTH_SHOUTS, 3).map((s, i) => (
                    <button key={i} className="wb-opt" onClick={() => doShout(s)}>「{s.line}」</button>
                  ))}
                  <button className="wb-opt" style={{ background: "#E8E0D2" }} onClick={() => setModal(null)}>算了，喊了也沒人聽</button>
                </div>
              </>
            )}

            {modal.type === "defend" && (
              <>
                <h3 className="font-black mb-1"> 守備柵欄</h3>
                <p className="text-xs opacity-70 mb-3 font-bold">柵欄是年輕人的防線。選一個守備行動：</p>
                <div className="grid gap-2">
                  <button className="wb-opt" disabled={trapCd > 0} style={trapCd > 0 ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                    onClick={() => { setModal(null); setTrap(); }}>
                     設陷阱{trapCd > 0 ? `（冷卻 ${trapCd}s）` : "— 早鳥券、假 WiFi、養生講座傳單…"}
                  </button>
                  <button className="wb-opt" disabled={shoutCd > 0 || shoutUses >= SHOUT_LIMIT}
                    style={shoutCd > 0 || shoutUses >= SHOUT_LIMIT ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                    onClick={() => setModal({ type: "shout" })}>
                     大聲公{shoutUses >= SHOUT_LIMIT ? "（本場已用完）" : "— 隔著柵欄公開回敬"}
                  </button>
                  <button className="wb-opt" style={{ background: "#E8E0D2" }} onClick={() => setModal(null)}>繼續巡邏</button>
                </div>
              </>
            )}

            {modal.type === "tarot" && (
              <>
                <h3 className="font-black mb-1"> 靈性角落</h3>
                <p className="text-xs opacity-70 mb-3 font-bold">水晶已淨化、鼠尾草點好了。抽一張，看宇宙今天想說什麼。</p>
                <div className="grid gap-2">
                  <button className="wb-opt" style={{ background: "#E8DFF5", textAlign: "center", fontSize: 16 }} onClick={drawTarot}> 抽一張塔羅</button>
                  <button className="wb-opt" style={{ background: "#E8E0D2" }} onClick={() => setModal(null)}>我才不信這個（默默離開）</button>
                </div>
              </>
            )}

            {modal.type === "story" && (
              <>
                <h3 className="font-black mb-1"> 拍照打卡區 — 發一則限動</h3>
                <p className="text-xs opacity-70 mb-3 font-bold">社群就是年輕人的武器。發出去就收不回來了。</p>
                <div className="grid gap-2">
                  <button className="wb-opt" onClick={() => {
                    setModal(null); beep(1200, 0.08);
                    setYouthScore((s) => s + 200); setElderScore((s) => s - 150);
                    addPop("+200 窘照曝光！"); addPop("長輩 −150", "#7A3A8E");
                    setBubble("喀嚓！上傳中…"); setTimeout(() => setBubble(null), 2100);
                    pushLed(`${me.name} 發限動：${modal.elder.name} 偷渡未遂窘照曝光！面子 −150，20 秒內不敢再偷渡 +200`, modal.elder.id);
                  }}>
                     拍 {modal.elder.name} 偷渡未遂的窘照<br /><span className="text-xs opacity-60">年輕人 +200，該長輩面子 −150</span>
                  </button>
                  <button className="wb-opt" onClick={() => {
                    setModal(null); beep(1200, 0.08);
                    setYouthScore((s) => s + 100); addPop("+100 年輕人分");
                    setBubble("#今日穿搭 #OOTD"); setTimeout(() => setBubble(null), 2100);
                    pushLed(`${me.name} 發了 #今日穿搭，年輕人 NPC 聚集圍觀，防守人氣 +100`, me.id);
                  }}>
                     發一則 #今日穿搭<br /><span className="text-xs opacity-60">吸引年輕人聚集，年輕人 +100</span>
                  </button>
                  <button className="wb-opt" onClick={() => {
                    setModal(null); beep(1200, 0.08); setTimeout(() => beep(1200, 0.08), 120);
                    setYouthScore((s) => s + 150); addPop("+150 年輕人分");
                    setBubble("轉發！"); setTimeout(() => setBubble(null), 2000);
                    pushLed(`${me.name} 轉發了 LED 公審畫面，此畫面已被分享 87 次 +150`, me.id);
                  }}>
                     轉發 LED 公審畫面<br /><span className="text-xs opacity-60">已被分享 87 次，年輕人 +150</span>
                  </button>
                  <button className="wb-opt" style={{ background: "#E8E0D2" }} onClick={() => setModal(null)}>算了，先拍個自拍就好</button>
                </div>
              </>
            )}

            {modal.type === "ksong" && (
              <>
                <h3 className="font-black mb-1"> 卡拉OK 點歌</h3>
                <p className="text-xs opacity-70 mb-3 font-bold">今天是婚禮，要唱什麼自己看著辦…</p>
                <div className="grid gap-2">
                  {(modal.options || KSONGS.slice(0, 3)).map((s, i) => (
                    <button key={i} className="wb-opt" style={s.mood === "sad" ? { background: "#E4E0EE" } : {}} onClick={() => pickKaraoke(s)}>
                      <span className="px-1.5 py-0.5 mr-1 text-[10px] rounded-md" style={{ background: s.lang === "台" ? "#C8102E" : "#3E5C8E", color: "#fff" }}>{s.lang}</span>
                      <b>《{s.t}》</b><span className="opacity-60">／{s.a}</span><br />
                      <span className="text-xs opacity-60">{s.hint}</span>
                    </button>
                  ))}
                  <button className="wb-opt" style={{ background: "#E8E0D2" }} onClick={() => setModal(null)}>清清喉嚨先不唱</button>
                </div>
              </>
            )}

            {modal.type === "song" && (
              <>
                <h3 className="font-black mb-1"> DJ 台點歌 — 反制卡拉OK！</h3>
                <p className="text-xs opacity-70 mb-3 font-bold">點一首 +100。每點滿 3 首觸發「全場大合唱」反殺蓋台 +300！</p>
                <div className="grid gap-2">
                  {modal.options.map((s, i) => (
                    <button key={i} className="wb-opt" onClick={() => pickSong(s)}> {s.a}〈{s.t}〉</button>
                  ))}
                  <button className="wb-opt" style={{ background: "#E8E0D2" }} onClick={() => setModal(null)}>沒有想聽的…</button>
                </div>
              </>
            )}

            {modal.type === "schmooze" && (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <CharSprite id={modal.elder.id} w={56} />
                  <div className="font-black text-sm">{modal.elder.name} 在邊界鬼鬼祟祟…<br /><span className="text-xs opacity-60 font-bold">用社畜話術陰他！成功 +250；被高感知長輩識破不扣分，但會原地石化＋長輩士氣 +100</span></div>
                </div>
                <div className="grid gap-2">
                  {modal.opts.map((o) => (
                    <button key={o.id} className="wb-opt" onClick={() => resolveSchmooze(o)}>
                       <b>{o.name}</b>「{gline(o.line, modal.elder)}」<br /><span className="text-xs opacity-60">{gline(o.sub, modal.elder)}</span>
                    </button>
                  ))}
                  <button className="wb-opt" style={{ background: "#E8E0D2" }} onClick={() => setModal(null)}>先不要好了…</button>
                </div>
              </>
            )}

            {modal.type === "cards" && (
              <>
                <div className="flex items-start gap-3 mb-2">
                  <CharSprite id={modal.elder.id} w={64} />
                  <div>
                    <div className="font-black text-sm mb-1">{modal.elder.name} 對你說：</div>
                    <div className="inline-block px-3 py-1.5 font-black text-sm" style={{ background: "#F6D9D2", border: `3px solid ${INK}`, borderRadius: "14px 14px 14px 2px" }}>「{modal.phrase.text}」</div>
                  </div>
                </div>
                <p className="text-xs opacity-70 mb-2 font-bold">抽到 3 張回嗆卡——每張都帶刺，差別只是笑點路線。嗆過頭可能被新娘瞪（糗而已）：</p>
                <div className="grid gap-2 mb-2">
                  {modal.cards.map((c) => (
                    <button key={c.id} className="wb-opt" onClick={() => playCard(c)}>
                      <b>{c.name}</b>：{cardLine(c, modal.elder)}<br /><span className="text-xs opacity-60">效果：{c.effect}</span>
                    </button>
                  ))}
                </div>
                <button className="wb-opt" style={{ background: "#E8E0D2" }} onClick={ignoreCard}> 算了不理他（場子會冷掉，連鎖歸零）</button>
              </>
            )}

            {modal.type === "quitgroup" && (
              <>
                <h3 className="font-black mb-1"> 確定要退出「相親相愛一家人」群組嗎？</h3>
                <p className="text-xs opacity-70 mb-3 font-bold">這是終極大招。按下去，這場婚禮就正式進入傳說。沒有回頭路。</p>
                <div className="grid gap-2">
                  <button className="wb-opt" style={{ background: "#1d1a17", color: "#FFE6A0" }} onClick={() => {
                    setModal(null); setQuitGroup(true);
                    buzz(); flashRed();
                    setBubble("已退出群組。"); setTimeout(() => setBubble(null), 2600);
                    pushLed(`【系統通知】${me.name} 已退出『相親相愛一家人』群組——全場手機同時震動`);
                    addChaos(100, `${me.name} 當眾退出家庭群組`, me.name);
                  }}> 退出群組（火爆直衝 100）</button>
                  <button className="wb-opt" style={{ background: "#E8E0D2" }} onClick={() => setModal(null)}>再忍一下好了…</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- NPC ---------- */
function NPCSprite({ id, x, y, w = 60, flip, onClick, hot, dance, react }) {
  return (
    <div onClick={onClick} className={`${onClick ? "wb-stop" : ""} ${hot ? "wb-hot" : ""}`}
      style={{ position: "absolute", left: x, bottom: y, cursor: onClick ? "pointer" : "default", zIndex: react ? 30 : 10 }}>
      {react && (
        <div className="wb-pop" style={{ position: "absolute", bottom: "calc(100% + 9px)", left: "50%", transform: "translateX(-50%)", background: "#fff", border: `3px solid ${INK}`, borderRadius: 0, padding: "3px 8px", fontWeight: 900, fontSize: 11, boxShadow: `2px 2px 0 ${INK}`, zIndex: 32, maxWidth: 150, whiteSpace: "normal", width: "max-content", textAlign: "left", lineHeight: 1.35 }}>
          {react.text}
        </div>
      )}
      <div style={{
        transform: flip ? "scaleX(-1)" : "none",
        animation: react && react.expr ? "wbKick .3s linear 5" : dance ? "wbWalk .5s linear infinite" : "wbIdle 2.6s ease-in-out infinite",
        transformOrigin: "bottom center",
        filter: "drop-shadow(0 3px 2px rgba(0,0,0,.2))",
      }}>
        <CharSprite id={id} w={w} expression={react && react.expr ? react.expr : "idle"} />
      </div>
      {hot && <div className="wb-hint"> 搭話</div>}
    </div>
  );
}

/* ----------  新郎新娘（無臉象徵設計） ---------- */
function CoupleSprite({ x, y, onClick, hot, cdLabel }) {
  return (
    <div onClick={onClick} className={`${onClick ? "wb-stop" : ""} ${hot ? "wb-hot" : ""}`}
      style={{ position: "absolute", left: x, bottom: y, cursor: onClick ? "pointer" : "default", zIndex: 10 }}>
      <div style={{ animation: "wbIdle 2.8s ease-in-out infinite", transformOrigin: "bottom center", filter: "drop-shadow(0 3px 2px rgba(0,0,0,.2))" }}>
        <svg width={112} height={122} viewBox="0 0 130 142">
          <path d="M 18 96 L 56 96 Q 62 118 60 138 L 14 138 Q 12 118 18 96 Z" fill="#26222A" stroke={INK} strokeWidth={3.5} />
          <path d="M 30 96 L 37 107 L 44 96" fill="#fff" stroke={INK} strokeWidth={2.5} />
          <circle cx={50} cy={102} r={4} fill="#E86AA0" stroke={INK} strokeWidth={2} />
          <circle cx={37} cy={66} r={26} fill="#EFC9B8" stroke={INK} strokeWidth={3.5} />
          <path d="M 13 62 Q 14 40 37 38 Q 60 40 61 62 Q 50 50 37 50 Q 24 50 13 62 Z" fill="#241F1C" stroke={INK} strokeWidth={3} />
          <path d="M 76 96 L 112 96 Q 124 118 121 140 L 67 140 Q 64 118 76 96 Z" fill="#FBF6EC" stroke={INK} strokeWidth={3.5} />
          <circle cx={94} cy={66} r={25} fill="#F2D8C9" stroke={INK} strokeWidth={3.5} />
          <path d="M 70 60 Q 72 40 94 38 Q 116 40 118 60 Q 106 50 94 50 Q 82 50 70 60 Z" fill="#5A3A28" stroke={INK} strokeWidth={3} />
          <path d="M 68 46 Q 94 20 120 46 L 120 60 Q 94 38 68 60 Z" fill="rgba(255,255,255,.8)" stroke={INK} strokeWidth={2.5} />
          <circle cx={94} cy={36} r={5} fill="#F2C9D0" stroke={INK} strokeWidth={2} />
          <path d="M 58 106 Q 67 112 76 106" fill="none" stroke={INK} strokeWidth={3.5} />
          <path d="M 60 86 L 70 86 L 67 94 L 63 94 Z" fill="#E8B0B8" stroke={INK} strokeWidth={2} />
          <line x1={65} y1={94} x2={65} y2={100} stroke={INK} strokeWidth={2.5} />
        </svg>
      </div>
      {hot && <div className="wb-hint">{cdLabel || "向新人敬酒"}</div>}
    </div>
  );
}

/* ----------  開場故事分鏡：喜帖 × 戰帖 ---------- */
function IntroModal({ css, onClose, onStart }) {
  const [page, setPage] = useState(0);
  const GOLD = "#E8B84B", GOLDL = "#FFE6A0";

  const Sp = ({ id, w = 62, flip }) => (
    <div style={{ transform: flip ? "scaleX(-1)" : "none", animation: "wbIdle 2.2s ease-in-out infinite", transformOrigin: "bottom center" }}>
      <CharSprite id={id} w={w} />
    </div>
  );
  const Wrap = ({ children }) => (
    <div className="flex items-end justify-center gap-1.5 mb-3" style={{ minHeight: 128 }}>{children}</div>
  );
  const Fence = () => (
    <svg width={70} height={122} viewBox="0 0 84 148">
      <circle cx={42} cy={10} r={7} fill="#5A1212" stroke={INK} strokeWidth={2.5} />
      {[6, 22, 38, 54, 70].map((x) => <rect key={x} x={x} y={20} width={6} height={128} fill="#6A6A75" stroke={INK} strokeWidth={2} />)}
      <rect x={0} y={42} width={84} height={7} fill="#55555F" stroke={INK} strokeWidth={2} />
      <rect x={0} y={112} width={84} height={7} fill="#55555F" stroke={INK} strokeWidth={2} />
    </svg>
  );

  const pages = [
    {
      title: "謹訂於本週末，舉行婚禮",
      visual: (
        <Wrap>
          <span className="text-4xl self-center"></span>
          <div className="relative" style={{ width: 112, height: 125 }}><CoupleSprite x={0} y={0} /></div>
          <span className="text-4xl self-center"></span>
        </Wrap>
      ),
      lines: <>戶外草地、燭光、自助餐，一切都完美。<br />新郎新娘只有一個小小的願望：<br /><b>「拜託……讓婚禮平安結束。」</b></>,
    },
    {
      title: "但賓客名單，是一場災難",
      visual: (
        <Wrap>
          <Sp id="e1" /><Sp id="e2" w={56} />
          <span className="text-3xl font-black self-center"></span>
          <Sp id="y3" flip /><Sp id="y4" w={56} flip />
        </Wrap>
      ),
      lines: <>上次表姊的婚禮——<br />三個年輕人被問薪水問到<b>提早離場</b>，<br />二舅公被回嗆到<b>血壓飆高</b>。<br /><span className="opacity-60">這次，絕對不能重蹈覆轍。</span></>,
    },
    {
      title: "於是新人做了史無前例的決定",
      visual: (
        <Wrap>
          <Sp id="e4" w={50} /><Sp id="guard" w={56} />
          <Fence />
          <Sp id="guard" w={56} flip /><Sp id="y1" w={50} flip />
        </Wrap>
      ),
      lines: <>請保鏢架起<b>鐵柵欄</b>，會場一分為二——<br /><b style={{ color: "#C8102E" }}>左：長輩區</b>　卡拉OK・茶水・麻將<br /><b style={{ color: "#3E7C6E" }}>右：年輕人區</b>　DJ・燭光・自助餐<br /><span className="opacity-60">井水不犯河水。⋯⋯理論上。</span></>,
    },
    {
      title: "茲此下戰帖，開打！",
      visual: (
        <Wrap>
          <Sp id="e1" w={56} /><Sp id="e3" w={56} />
          <span className="text-2xl font-black self-center px-1" style={{ color: "#C8102E" }}>VS</span>
          <Sp id="y2" w={56} flip /><Sp id="y3" w={56} flip />
        </Wrap>
      ),
      lines: <>長輩們不甘寂寞，發誓要<b>偷渡過柵欄</b>，<br />把「關心」一句不漏地講完；<br />年輕人誓死守住邊界，<b>讓每句地雷話付出代價</b>。<br /><b>3 分鐘定勝負。你，要選哪一邊？</b></>,
      war: true,
    },
    { title: "戰帖・怎麼得分（30 秒看完）", rules: true, war: true },
  ];

  const p = pages[page];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ background: "rgba(18,7,9,.88)" }}>
      <style>{css}</style>
      <div key={page} className="wb-pop w-full max-w-md relative flex flex-col" style={{
        background: "linear-gradient(160deg, #C8102E 0%, #A50E22 70%, #8E0C1D 100%)",
        border: `4px solid ${INK}`, borderRadius: 18, boxShadow: `7px 7px 0 ${INK}`,
        color: INK, maxHeight: "92dvh", padding: "8px 8px 12px",
      }}>
        {/* 燙金雙框 */}
        <div style={{ position: "absolute", inset: 6, border: `2.5px solid ${GOLD}`, borderRadius: 13, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 11, border: "1px solid rgba(255,230,160,.5)", borderRadius: 10, pointerEvents: "none" }} />
        {/* 四角囍字 */}
        <span style={{ position: "absolute", top: 10, left: 14, color: GOLDL, fontSize: 13, fontWeight: 900 }}>囍</span>
        <span style={{ position: "absolute", bottom: 9, left: 14, color: GOLDL, fontSize: 13, fontWeight: 900 }}>囍</span>
        <span style={{ position: "absolute", bottom: 9, right: 14, color: GOLDL, fontSize: 13, fontWeight: 900 }}>囍</span>
        <button onClick={onClose} className="text-[11px] font-black underline" style={{ position: "absolute", top: 9, right: 16, zIndex: 3, color: GOLDL, opacity: 0.95 }}> 跳過</button>

        {/* 帖頭 */}
        <div className="text-center relative pt-2" style={{ zIndex: 1 }}>
          <div className="text-[10px] font-black" style={{ color: GOLD, letterSpacing: ".45em", textIndent: ".45em" }}>{p.war ? "— 戰 帖 —" : "— 喜 帖 —"}</div>
        </div>

        {/* 內頁 */}
        {p.rules ? (
          <div className="relative mx-2.5 mt-2 mb-2 overflow-y-auto" style={{ zIndex: 1 }}>
            {/* 上卷軸桿 */}
            <div style={{ height: 17, margin: "0 -5px", background: "linear-gradient(180deg,#9A6630,#5E3A18)", border: `3px solid ${INK}`, borderRadius: 10, position: "relative", zIndex: 2 }} />
            {/* 羊皮紙卷身（展開動畫） */}
            <div style={{
              transformOrigin: "top center", animation: "wbUnroll .55s ease-out both",
              background: "linear-gradient(90deg,#DCC18C 0%,#F1E2BC 7%,#F8EDD2 50%,#F1E2BC 93%,#DCC18C 100%)",
              borderLeft: `3px solid ${INK}`, borderRight: `3px solid ${INK}`,
              padding: "12px 16px 14px", color: INK, fontSize: 12, fontWeight: 700, lineHeight: 1.8,
            }}>
              <h3 className="font-black text-base text-center mb-2">{p.title}</h3>
              <div style={{ fontWeight: 900, fontSize: 13, borderBottom: `2px solid ${INK}`, paddingBottom: 2, marginBottom: 4 }}>這場婚禮的目的</div>
              <p className="mb-2">不是打贏對面，是<b>讓婚禮越來越失控</b>。全場共用一條「現場火爆指數」（0 到 100）：長輩每講完一句地雷話、年輕人每回敬一句，指數就往上跳。<b>90 秒結束時指數落在哪一段，就演出哪一種結局</b>——從最無聊的「尷尬收場」到傳說級的「全場大亂鬥」。</p>

              <div style={{ fontWeight: 900, fontSize: 13, borderBottom: `2px solid ${INK}`, paddingBottom: 2, marginBottom: 4 }}>長輩怎麼玩</div>
              <p className="mb-2">走到柵欄「查看闖關任務」，選一條路線闖進年輕人區，找人把「關心」講完。講成功指數大漲；被抓只是罰紅包錢、被保鏢架回去——回來再闖一次就好。</p>

              <div style={{ fontWeight: 900, fontSize: 13, borderBottom: `2px solid ${INK}`, paddingBottom: 2, marginBottom: 4 }}>年輕人怎麼玩</div>
              <p className="mb-2">警報響起就抓出偽裝的長輩；被講地雷話就抽回嗆卡回敬——每張都帶刺，差別只是笑點路線，連續交鋒還有連鎖加成。也可以主動搭話陰可疑長輩、去柵欄設防、DJ 點歌反制卡拉OK。</p>

              <div style={{ fontWeight: 900, fontSize: 13, borderBottom: `2px solid ${INK}`, paddingBottom: 2, marginBottom: 4 }}>大聲公</div>
              <p className="mb-2">兩邊都能用、每場限兩次：選一句話全場放送，跑馬燈重播、對面一定有反應，火爆指數大漲。要留到關鍵時刻還是開場就轟，自己決定。</p>

              <div style={{ fontWeight: 900, fontSize: 13, borderBottom: `2px solid ${INK}`, paddingBottom: 2, marginBottom: 4 }}>錢是錢，火爆是火爆</div>
              <p className="mb-2">「紅包基金」是長輩的錢包：被抓的罰款從這裡扣、向新人敬酒能回血。<b>錢不會變成火爆指數</b>，但花光了有些路就走不了。</p>

              <div style={{ fontWeight: 900, fontSize: 13, borderBottom: `2px solid ${INK}`, paddingBottom: 2, marginBottom: 4 }}>最重要的一條</div>
              <p><b>沒有輸這回事。</b>被抓、被架走、嗆過頭被新娘瞪，都只是場面更精彩的素材。指數越高、結局越傳奇——所以放膽玩最大的。</p>
            </div>
            {/* 下卷軸桿 */}
            <div style={{ height: 17, margin: "0 -5px", background: "linear-gradient(180deg,#9A6630,#5E3A18)", border: `3px solid ${INK}`, borderRadius: 10, position: "relative", zIndex: 2 }} />
          </div>
        ) : (
          <div className="relative mx-2.5 mt-2 mb-2 px-3 py-3 overflow-y-auto" style={{ zIndex: 1, background: "#FBF6EC", border: `3px solid ${INK}`, borderRadius: 12, boxShadow: "inset 0 0 0 1.5px rgba(232,184,75,.6)" }}>
            <h3 className="font-black text-lg text-center leading-snug mb-2">{p.title}</h3>
            {p.visual}
            <div className="text-sm font-bold leading-relaxed text-center">{p.lines}</div>
          </div>
        )}

        {/* 頁數指示點（金） */}
        <div className="flex items-center justify-center gap-1.5 relative" style={{ zIndex: 1 }}>
          {pages.map((_, i) => (
            <span key={i} style={{ width: 9, height: 9, borderRadius: 5, border: `2px solid ${INK}`, background: i === page ? GOLDL : "rgba(255,230,160,.28)" }} />
          ))}
        </div>

        <div className="flex gap-2 mt-2 justify-center relative" style={{ zIndex: 1 }}>
          {page > 0 && <button className="wb-opt" style={{ width: "auto", background: "#FBF6EC", borderRadius: 16 }} onClick={() => setPage(page - 1)}>◀</button>}
          {page < pages.length - 1
            ? <button className="wb-opt" style={{ width: "auto", background: GOLD, borderRadius: 16, fontWeight: 900 }} onClick={() => setPage(page + 1)}>下一頁 ▶</button>
            : <button className="wb-opt" style={{ width: "auto", background: GOLD, borderRadius: 16, fontWeight: 900 }} onClick={onStart}> 接下戰帖・選邊開戰</button>}
        </div>
      </div>
    </div>
  );
}

/* ---------- 翻牆 QTE ---------- */
function ClimbGame({ onWin, onLose, charId }) {
  const TARGET = 15, LIMIT = 5;
  const [count, setCount] = useState(0);
  const [left, setLeft] = useState(LIMIT);
  const [started, setStarted] = useState(false);
  const [fail, setFail] = useState(false);
  const [win, setWin] = useState(false);
  const doneRef = useRef(false);
  useEffect(() => {
    if (!started || doneRef.current) return;
    if (left <= 0) {
      doneRef.current = true; setFail(true);
      setTimeout(onLose, 1300);
      return;
    }
    const t = setTimeout(() => setLeft((s) => +(s - 0.1).toFixed(1)), 100);
    return () => clearTimeout(t);
  }, [started, left, onLose]);
  const tap = () => {
    if (doneRef.current) return;
    if (!started) setStarted(true);
    const n = count + 1; setCount(n);
    if (n >= TARGET) { doneRef.current = true; setWin(true); setTimeout(onWin, 700); }
  };
  const pct = Math.min(1, count / TARGET);
  return (
    <>
      <h3 className="font-black mb-1"> 翻牆偷渡！</h3>
      <p className="text-xs opacity-70 mb-2 font-bold">{LIMIT} 秒內連點 {TARGET} 下爬過鐵柵欄！（第一下開始計時）</p>
      {/* 爬牆舞台 */}
      <div className="relative mx-auto mb-2 overflow-hidden" style={{ width: 220, height: 190, background: "linear-gradient(180deg,#BFD8EE 0%,#DCEBD8 70%,#C9A66B 70%,#C9A66B 100%)", border: `3px solid ${INK}`, borderRadius: 14 }}>
        {/* 鐵柵欄 */}
        {[28, 58, 88, 118, 148, 178].map((x) => (
          <div key={x} style={{ position: "absolute", left: x, top: 12, width: 7, height: 148, background: "#6A6A75", border: `2px solid ${INK}`, borderRadius: 3 }} />
        ))}
        <div style={{ position: "absolute", left: 16, top: 30, width: 180, height: 7, background: "#55555F", border: `2px solid ${INK}` }} />
        <div style={{ position: "absolute", left: 16, top: 120, width: 180, height: 7, background: "#55555F", border: `2px solid ${INK}` }} />
        {/* 玩家：青蛙式攀爬 */}
        <div style={{
          position: "absolute", left: "50%", marginLeft: -29,
          bottom: fail ? 4 : 18 + pct * 118,
          transition: fail ? "bottom .55s cubic-bezier(.5,0,1,1)" : "bottom .12s linear",
          transform: fail ? "rotate(180deg)" : win ? "rotate(-20deg) translateY(-8px)" : `rotate(${count % 2 ? 14 : -14}deg) scaleX(${count % 2 ? 1 : -1})`,
          transformOrigin: "center",
        }}>
          <CharSprite id={charId} w={58} expression={fail ? "shock" : "idle"} />
        </div>
        {count > 6 && !fail && <div style={{ position: "absolute", left: "68%", bottom: 40 + pct * 110, fontSize: 16 }}></div>}
        {fail && <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 52, fontSize: 26, fontWeight: 900, color: "#C8102E", textShadow: "1px 1px 0 #fff" }}>啪！</div>}
        {win && <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: 6, fontSize: 20 }}></div>}
      </div>
      {fail ? (
        <div className="text-sm font-black text-center mb-2" style={{ color: "#C8102E" }}>哎唷喂呀…記得回去貼沙隆巴斯 </div>
      ) : (
        <>
          <div className="h-3.5 mb-1.5 overflow-hidden" style={{ background: "#E8E0D2", border: `3px solid ${INK}`, borderRadius: 10 }}>
            <div className="h-full transition-all" style={{ width: `${pct * 100}%`, background: "#E8B84B" }} />
          </div>
          <div className="text-xs mb-2 font-bold opacity-80"> 剩 {left.toFixed(1)} 秒　|　{count}/{TARGET}</div>
          <button onClick={tap} className="wb-opt" style={{ textAlign: "center", fontSize: 22, padding: "16px 0", background: "#C8102E", color: "#fff" }}> 爬！爬！爬！</button>
        </>
      )}
    </>
  );
}

/*  長輩踏步捷徑：照節奏踏 左右左右… */
function StepGame({ onWin, onLose }) {
  const LIMIT = 6;
  const [seq] = useState(() => Array.from({ length: 6 }, () => (Math.random() < 0.5 ? "L" : "R")));
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(LIMIT);
  const [started, setStarted] = useState(false);
  const [stomp, setStomp] = useState(null); // {side, n}
  const [fail, setFail] = useState(false);
  const doneRef = useRef(false);
  useEffect(() => {
    if (!started || doneRef.current) return;
    if (left <= 0) { doneRef.current = true; setFail(true); setTimeout(onLose, 1100); return; }
    const t = setTimeout(() => setLeft((s) => +(s - 0.1).toFixed(1)), 100);
    return () => clearTimeout(t);
  }, [started, left, onLose]);
  const press = (side) => {
    if (doneRef.current) return;
    if (!started) setStarted(true);
    setStomp({ side, n: Date.now() });
    if (seq[idx] === side) {
      const n = idx + 1; setIdx(n);
      if (n >= seq.length) { doneRef.current = true; setTimeout(onWin, 450); }
    } else {
      doneRef.current = true; setFail(true); setTimeout(onLose, 1100);
    }
  };
  const Leg = ({ side }) => {
    const active = stomp && stomp.side === side;
    return (
      <div key={active ? stomp.n : side} style={{ display: "inline-block", margin: "0 7px", animation: active ? "wbKick .22s ease-out 1" : "none" }}>
        <div style={{ width: 26, height: 64, background: "#7A6A55", border: `3px solid ${INK}`, borderRadius: "8px 8px 4px 4px" }} />
        <div style={{ width: 40, height: 16, marginLeft: side === "L" ? -12 : -2, background: "linear-gradient(90deg,#3B82C4 33%,#fff 33%,#fff 66%,#3B82C4 66%)", border: `3px solid ${INK}`, borderRadius: "4px 10px 4px 4px", transform: side === "L" ? "scaleX(-1)" : "none" }} />
      </div>
    );
  };
  return (
    <>
      <h3 className="font-black mb-1"> 長輩捷徑 — 踏步密道</h3>
      <p className="text-xs opacity-70 mb-2 font-bold">相傳是二十年前某位舅公留下的。{LIMIT} 秒內照順序踏對節奏！</p>
      {/* 節奏題目 */}
      <div className="flex justify-center gap-1.5 mb-2">
        {seq.map((s, i) => (
          <div key={i} style={{
            width: 38, height: 42, borderRadius: 10,
            border: `3px solid ${INK}`,
            background: i < idx ? "#E8E0D2" : i === idx ? "#FFE6A0" : "#fff",
            boxShadow: i === idx ? `3px 3px 0 ${INK}` : `1.5px 1.5px 0 ${INK}`,
            opacity: i < idx ? 0.35 : 1,
            transform: i === idx ? "scale(1.18)" : "scale(1)",
            animation: i === idx && !fail ? "wbBounce .8s ease-in-out infinite" : "none",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            fontWeight: 900, color: INK, lineHeight: 1,
          }}>
            <span style={{ fontSize: 20 }}>{s === "L" ? "◀" : "▶"}</span>
            <span style={{ fontSize: 9, marginTop: 1 }}>{s === "L" ? "左" : "右"}</span>
          </div>
        ))}
      </div>
      {/* 一雙腿 */}
      <div className="text-center mb-1" style={{ background: "#EFE6D4", border: `3px solid ${INK}`, borderRadius: 14, padding: "12px 0 6px" }}>
        <div style={{ width: 76, height: 18, margin: "0 auto -4px", background: "#8A4A3A", border: `3px solid ${INK}`, borderRadius: 8 }} />
        <Leg side="L" /><Leg side="R" />
        <div className="text-[10px] font-black opacity-50 mt-1">（穿藍白拖踏比較有效，前人說的）</div>
      </div>
      {fail ? (
        <div className="text-sm font-black text-center my-2" style={{ color: "#C8102E" }}>踏錯啦！機關「喀」一聲卡住了 </div>
      ) : (
        <div className="text-xs mb-2 font-bold opacity-80 text-center"> 剩 {left.toFixed(1)} 秒（第一踏開始計時）　{idx}/{seq.length}</div>
      )}
      <div className="flex gap-2">
        <button onClick={() => press("L")} className="wb-opt flex-1" style={{ textAlign: "center", fontSize: 19, fontWeight: 900, padding: "14px 0", background: "#fff" }}>◀ 左腳</button>
        <button onClick={() => press("R")} className="wb-opt flex-1" style={{ textAlign: "center", fontSize: 19, fontWeight: 900, padding: "14px 0", background: "#fff" }}>右腳 ▶</button>
      </div>
    </>
  );
}

function CartGame({ onWin, onLose }) {
  const [pos, setPos] = useState(0);
  const dirRef = useRef(1);
  const doneRef = useRef(false);
  useEffect(() => {
    const t = setInterval(() => {
      setPos((p) => {
        let n = p + dirRef.current * 3.2;
        if (n >= 100) { n = 100; dirRef.current = -1; }
        if (n <= 0) { n = 0; dirRef.current = 1; }
        return n;
      });
    }, 30);
    return () => clearInterval(t);
  }, []);
  const jump = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (pos >= 38 && pos <= 62) onWin(); else onLose();
  };
  return (
    <>
      <h3 className="font-black mb-1"> 木馬屠城！</h3>
      <p className="text-xs opacity-70 mb-2 font-bold">趁服務生不注意——當游標在綠色區域時按下！</p>
      {/* 藏進餐車的人體視覺 */}
      <div className="relative mx-auto mb-2" style={{ width: 190, height: 108 }}>
        <div style={{ position: "absolute", left: 20, top: 0, width: 150, height: 70, background: "#D8D8DE", border: `3px solid ${INK}`, borderRadius: 10, animation: "wbSway 1.6s ease-in-out infinite alternate" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 26, background: "#fff", borderBottom: `3px solid ${INK}`, borderRadius: "7px 7px 0 0" }} />
          <div style={{ position: "absolute", left: "50%", top: -16, transform: "translateX(-50%)", fontSize: 22 }}></div>
          <div style={{ position: "absolute", left: 8, top: 34, fontSize: 10, fontWeight: 900, opacity: 0.6 }}>本日特餐：佛跳牆（？）</div>
        </div>
        {/* 車底露出的腿 */}
        <div style={{ position: "absolute", left: 62, top: 66, width: 13, height: 26, background: "#7A6A55", border: `2.5px solid ${INK}`, borderRadius: 5, transform: "rotate(-10deg)" }} />
        <div style={{ position: "absolute", left: 96, top: 66, width: 13, height: 26, background: "#7A6A55", border: `2.5px solid ${INK}`, borderRadius: 5, transform: "rotate(12deg)" }} />
        <div style={{ position: "absolute", left: 52, top: 88, width: 26, height: 10, background: "#3B82C4", border: `2.5px solid ${INK}`, borderRadius: "3px 8px 3px 3px", transform: "scaleX(-1)" }} />
        <div style={{ position: "absolute", left: 100, top: 88, width: 26, height: 10, background: "#3B82C4", border: `2.5px solid ${INK}`, borderRadius: "3px 8px 3px 3px" }} />
        <div style={{ position: "absolute", right: 6, top: 6, fontSize: 16 }}></div>
        {/* 輪子 */}
        <div style={{ position: "absolute", left: 36, top: 64, width: 14, height: 14, background: "#1d1a17", borderRadius: "50%" }} />
        <div style={{ position: "absolute", left: 140, top: 64, width: 14, height: 14, background: "#1d1a17", borderRadius: "50%" }} />
        <div className="text-[10px] font-black opacity-50" style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>（腿露出來了喂！）</div>
      </div>
      <div className="relative h-9 mb-4 overflow-hidden" style={{ background: "#E8E0D2", border: `3px solid ${INK}`, borderRadius: 12 }}>
        <div className="absolute top-0 bottom-0" style={{ left: "38%", width: "24%", background: "rgba(127,175,106,.6)" }} />
        <div className="absolute top-0 bottom-0 w-2.5" style={{ left: `calc(${pos}% - 5px)`, background: "#C8102E", borderRadius: 4 }} />
      </div>
      <button onClick={jump} className="wb-opt" style={{ textAlign: "center", fontSize: 20, padding: "16px 0", background: "#C8102E", color: "#fff" }}> 就是現在，跳！</button>
    </>
  );
}
