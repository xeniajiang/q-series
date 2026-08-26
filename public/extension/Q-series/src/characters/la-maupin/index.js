import "noname";
const characters = {
  q_la_maupin: {
    // 使用noname默认的“？”性别标记；规则层按无性别处理。
    sex: "unknown",
    group: "q",
    hp: 4,
    maxHp: 4,
    skills: ["q_la_maupin_yuju", "q_la_maupin_kuangming"],
    img: "extension/Q-series/image/la-maupin.png"
  }
};
const translates = {
  q_la_maupin: "La Maupin",
  q_la_maupin_yuju: "逾矩",
  q_la_maupin_yuju_info: "游戏开始时，你获得一把不占用装备栏的【雌雄双股剑】，其技能对所有角色均可发动。你的武器栏仍可装备武器，两件武器的技能均可发动，你的攻击范围取二者较大值。若你的武器栏装备【雌雄双股剑】，两把【雌雄双股剑】的技能可分别发动，且你的攻击范围改为5。每当你的【雌雄双股剑】技能发动后，你获得1枚“酷”。若此次剑效由你以“决舞”使用或打出的【杀】触发，你不获得“酷”。若“狂名”已觉醒，你每回合至多因“逾矩”获得1枚“酷”。",
  q_la_maupin_yuju_virtual: "逾矩",
  q_la_maupin_yuju_equipped: "逾矩",
  q_la_maupin_kuangming: "狂名",
  q_la_maupin_kuangming_info: "觉醒技，准备阶段，若你拥有至少4枚“酷”，你减1点体力上限，然后选择一项：回复1点体力；或摸三张牌。然后你获得“决舞”。此后，每回合至多因“逾矩”获得1枚“酷”。",
  q_la_maupin_juewu: "决舞",
  q_la_maupin_juewu_info: "你可以移去1枚“酷”，视为使用或打出一张【杀】。每回合，若你以此法使用的【杀】的所有目标均为本回合首次以此法指定的角色，则此【杀】不计入本回合使用【杀】的次数。",
  q_la_maupin_ku: "酷"
};
export {
  characters,
  translates
};
//# sourceMappingURL=index.js.map
