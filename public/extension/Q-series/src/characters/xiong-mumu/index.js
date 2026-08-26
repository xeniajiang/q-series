import "noname";
const characters = {
  q_xiong_mumu: {
    sex: "female",
    group: "q",
    hp: 3,
    maxHp: 3,
    skills: ["q_xiong_shanyuan", "q_xiong_liye", "q_xiong_anfa"],
    img: "extension/Q-series/image/xiong-mumu.png"
  }
};
const translates = {
  q_xiong_mumu: "熊姆姆",
  q_xiong_shanyuan: "善缘",
  q_xiong_shanyuan_info: "每名角色的“缘”数至多为3；已有3枚“缘”的角色仍可成为此技能的目标。准备阶段，你可以选择一名其他角色并进行判定。若其“缘”数少于3，其获得1枚“缘”。若判定结果为红色，其获得此判定牌；若为黑色，你获得此判定牌。",
  q_xiong_liye: "立业",
  q_xiong_liye_info: "出牌阶段限一次，若场上有拥有“缘”的其他角色，你可以摸X张牌，然后尽可能弃置两张手牌，并选择一名拥有“缘”的其他角色，令其摸Y张牌，然后你获得1枚“酷”（X为拥有“缘”的其他角色数；Y为该角色的“缘”数）。当你进入濒死状态时，你可以移去1枚“酷”，将体力回复至1点。",
  q_xiong_anfa: "案发",
  q_xiong_anfa_info: "锁定技，每当你获得1枚“酷”后，若你的性别为女，你进行判定。若结果为梅花2至9，你的性别改为X，失去“善缘”和“立业”，并获得“遗患”。",
  q_xiong_yihuan: "遗患",
  q_xiong_yihuan_info: "准备阶段，若你拥有“酷”，你额外摸一张牌。当你与一名拥有“缘”的其他角色之间造成伤害后，伤害来源可以移去该角色所有“缘”，然后摸等量的牌。当你进入濒死状态时，若你拥有“酷”，你可以移去所有“酷”，将体力回复至1点。",
  q_xiong_yuan: "缘",
  q_xiong_yuan_info: "每名角色的“缘”数至多为3。已有3枚“缘”的角色仍可成为获得“缘”的目标，但其“缘”数不再增加。",
  q_xiong_ku: "酷"
};
export {
  characters,
  translates
};
//# sourceMappingURL=index.js.map
