import "noname";
const characters = {
  q_barbin: {
    sex: "unknown",
    group: "q",
    hp: 3,
    maxHp: 4,
    skills: ["q_barbin_zhipai", "q_barbin_ziming", "q_barbin_ganyu"],
    img: "extension/Q-series/image/barbin.png"
  }
};
const translates = {
  q_barbin: "Barbin",
  q_barbin_zhipai: "指派",
  q_barbin_zhipai_info: "锁定技。每轮前两次你成为其他角色使用牌或技能的目标时，该角色须声明“男”或“女”。若你有手牌，你可以弃置一张手牌拒绝此次指派，获得1枚“酷”；若如此做，你的性别保持为X。当你首次因拒绝指派令“酷”数达到3时，你选择一项：摸一张牌；或回复1点体力。若你未拒绝，则于此牌或技能对你结算期间，你的性别视为其声明的性别；若此时你的“男”“女”标记总数少于3，则获得1枚与其声明对应的标记。结算结束后，你的性别恢复为X。",
  q_barbin_zhipai_skill_target: "指派",
  q_barbin_ziming: "自名",
  q_barbin_ziming_info: "限定技。出牌阶段，若你拥有至少3枚“酷”，你可以清除所有“男”“女”标记，将你的性别永久改为X，摸三张牌，然后失去“指派”和“干预”，获得“余身”。发动此技能不移去“酷”。",
  q_barbin_ganyu: "干预",
  q_barbin_ganyu_info: "觉醒技。准备阶段，若你的“男”“女”标记总数正好为3，你将性别永久改为其中标记数较多的一项。然后，你获得较少一类标记数量两倍的“酷”，清除所有“男”“女”标记，摸三张牌，失去“指派”和“自名”，获得“余身”。",
  q_barbin_yushen: "余身",
  q_barbin_yushen_info: "每轮限一次，当一张其他角色使用的牌对你结算结束后，你获得1枚“酷”。每回合限一次，当你成为其他角色使用牌的目标时，你可以移去1枚“酷”，取消你作为此牌的目标；若你的性别为X且此时你仍有“酷”，你摸一张牌。",
  q_barbin_yushen_gain: "余身",
  q_barbin_yushen_cancel: "余身",
  q_barbin_sex: "当前性别",
  q_barbin_male: "男",
  q_barbin_female: "女",
  q_barbin_ku: "酷"
};
export {
  characters,
  translates
};
//# sourceMappingURL=index.js.map
