import { get, game } from "noname";
import { JUE_GAIN_TRIGGERS, IDENTITY_SELECTION_TRIGGERS, getPindianBoostControls, getPindianBoostAmount, getBoostedPindianNumber, shouldUseZhengquan, getRequiredZhengquanBoost, estimateHighestPindianNumber, shouldLevyJueGain, shouldTriggerShi, canBoostDanDamage, canUseSengConversion, getIdentityLabel, getIdentityRepeatResolution, isZhengquanTarget, XINXIANG_IDENTITIES, getIdentityFromLabel, chooseIdentityByOpportunity, getIdentitySex, estimateJueTaxes } from "./rules.js";
const XINXIANG_KU = "q_xinxiang_ku";
const KUAJUE = "q_xinxiang_kuajue";
const KUAJUE_SENG = "q_xinxiang_kuajue_seng";
const KUAJUE_DAN = "q_xinxiang_kuajue_dan";
const KUAJUE_SHI = "q_xinxiang_kuajue_shi";
const KUAJUE_JUE = "q_xinxiang_kuajue_jue";
const KUAJUE_SEX = "q_xinxiang_kuajue_sex";
const KUAJUE_IDENTITY = "q_xinxiang_kuajue_identity";
const KUAJUE_JUE_TARGET = "q_xinxiang_kuajue_jue_target";
const ZHENGQUAN = "q_xinxiang_zhengquan";
const ZHENGQUAN_BOOST = "q_xinxiang_zhengquan_boost";
function getSexLabel(identity) {
  const sex = getIdentitySex(identity);
  return sex === "unknown" ? "X" : get.translation(sex);
}
function updateIdentityMark(player, identity) {
  player.markSkill(KUAJUE);
  player.markSkill(KUAJUE_SEX);
  game.broadcastAll(
    (player2, identityLabel, sexLabel) => {
      const identityMark = player2.marks?.[KUAJUE];
      if (identityMark?.firstChild) identityMark.firstChild.innerHTML = identityLabel;
      const sexMark = player2.marks?.[KUAJUE_SEX];
      if (sexMark?.firstChild) sexMark.firstChild.innerHTML = sexLabel;
    },
    player,
    getIdentityLabel(identity),
    getSexLabel(identity)
  );
}
function getIdentity(player) {
  const identity = player.storage[KUAJUE_IDENTITY];
  return XINXIANG_IDENTITIES.includes(identity) ? identity : void 0;
}
function setSex(player, identity) {
  const sex = getIdentitySex(identity);
  game.broadcastAll(
    (player2, sex2) => {
      player2.sex = sex2;
    },
    player,
    sex
  );
}
function canChooseJue(player) {
  return game.hasPlayer((target) => target !== player && target.isIn() && target.countCards("h") < player.countCards("h"));
}
function getSelectableIdentities(player, excluded) {
  return XINXIANG_IDENTITIES.filter((identity) => identity !== excluded && (identity !== "jue" || canChooseJue(player)));
}
function getIdentityChoiceText(identity) {
  if (identity === "seng") return "僧（X）：♥2至9可当【无中生有】；不能使用【杀】";
  if (identity === "dan") return "旦（女）：每回合首次对男性造成的伤害+1";
  if (identity === "shi") return "士（男）：出牌阶段使用非延时类锦囊牌后摸一张牌";
  return "爵（男）：选择一名手牌数少于你的角色作为征收对象";
}
const JUE_EXTRA_GAIN_SKILLS = {
  jianxiong: 1,
  fankui: 1,
  yiji: 1,
  xiaoji: 1,
  lianying: 1,
  kurou: 1,
  biyue: 1,
  jizhi: 1,
  luoshen: 2
};
function isSafeSengCard(player, card) {
  if (!canUseSengConversion("seng", get.suit(card, player), get.number(card, player))) return false;
  const name = get.name(card, player);
  if (name === "tao" && player.hp < player.maxHp) return false;
  if (name === "shan" && player.hp <= 2 && player.countCards("h", (current) => get.name(current, player) === "shan") <= 1) return false;
  return true;
}
function getDanOpportunity(player) {
  const enemies = game.filterPlayer((target) => target !== player && target.sex === "male" && get.attitude(player, target) < 0);
  if (!enemies.length) return 0;
  let hasOpportunity = false;
  let slashSeen = false;
  for (const card of player.getCards("h")) {
    const name = get.name(card, player);
    if (!["sha", "juedou", "huogong", "nanman", "wanjian"].includes(name)) continue;
    if (name === "sha" && slashSeen) continue;
    if (name === "sha") slashSeen = true;
    const targets = enemies.filter((target) => {
      if (name === "huogong" && !target.countCards("h")) return false;
      return player.canUse(card, target, false);
    });
    if (!targets.length) continue;
    hasOpportunity = true;
    if (targets.some((target) => target.hp <= 2)) return 4;
  }
  return hasOpportunity ? 1 : 0;
}
function getJueExtraGainEvents(target) {
  return Object.entries(JUE_EXTRA_GAIN_SKILLS).reduce((total, [skill, amount]) => total + (target.hasSkill(skill) ? amount : 0), 0);
}
function getExpectedJueTaxes(player, target) {
  return estimateJueTaxes(player.countCards("h"), target.countCards("h"), getJueExtraGainEvents(target));
}
function getIdentityOpportunityLevels(player) {
  const safeHearts = player.getCards("h").filter((card) => isSafeSengCard(player, card)).length;
  const usableTricks = player.getCards("h").filter((card) => {
    if (get.type(card, player) !== "trick" || get.name(card, player) === "wuxie") return false;
    return player.hasUseTarget(card, false, false);
  });
  const hasWuzhong = usableTricks.some((card) => get.name(card, player) === "wuzhong");
  let bestTaxes = 0;
  game.countPlayer((target) => {
    if (target !== player && target.countCards("h") < player.countCards("h") && get.attitude(player, target) < 0) {
      bestTaxes = Math.max(bestTaxes, getExpectedJueTaxes(player, target));
    }
    return false;
  });
  return {
    dan: getDanOpportunity(player),
    seng: safeHearts >= 2 ? 2 : safeHearts,
    shi: usableTricks.length >= 2 || usableTricks.length === 1 && hasWuzhong ? 2 : usableTricks.length === 1 ? 1 : 0,
    jue: bestTaxes >= 2 ? 3 : bestTaxes === 1 ? 2 : 0
  };
}
async function chooseIdentity(player, excluded) {
  const identities = getSelectableIdentities(player, excluded);
  const controls = identities.map(getIdentityLabel);
  const result = await player.chooseControl({
    controls,
    choiceList: identities.map(getIdentityChoiceText),
    prompt: excluded ? `跨角：请选择一种不同于“${getIdentityLabel(excluded)}”的身份` : "跨角：选择一种身份",
    ai() {
      const player2 = get.player();
      const choices = get.event().controls;
      const legal = choices.map(getIdentityFromLabel).filter(Boolean);
      const identity = chooseIdentityByOpportunity(legal, getIdentity(player2), getIdentityOpportunityLevels(player2));
      return identity ? getIdentityLabel(identity) : choices[0];
    }
  }).forResult();
  return getIdentityFromLabel(result.control);
}
async function chooseJueTarget(player) {
  const result = await player.chooseTarget({
    prompt: "跨角·爵：选择一名手牌数少于你的其他角色",
    forced: true,
    filterTarget: (card, player2, target) => target !== player2 && target.countCards("h") < player2.countCards("h"),
    ai(target) {
      const player2 = get.player();
      return (get.attitude(player2, target) < 0 ? 10 : -10) + getExpectedJueTaxes(player2, target) * 5 + target.countCards("h") * 0.4 + target.hp * 0.1;
    }
  }).forResult();
  return result.targets?.[0];
}
function isEligibleZhengquanTarget(player, target) {
  if (target === player || !target.isIn() || target.countCards("h") <= 0 || !player.canCompare(target)) return false;
  const living = game.filterPlayer().map((current) => ({ hp: current.hp, handcardCount: current.countCards("h") }));
  return isZhengquanTarget({ hp: target.hp, handcardCount: target.countCards("h") }, living);
}
const skills = {
  [KUAJUE]: {
    trigger: { player: IDENTITY_SELECTION_TRIGGERS },
    group: [KUAJUE_SENG, KUAJUE_DAN, KUAJUE_SHI, KUAJUE_JUE],
    forced: true,
    async content(event, trigger, player) {
      const previous = getIdentity(player);
      let identity = await chooseIdentity(player);
      if (!identity) return;
      let levyTarget = identity === "jue" ? await chooseJueTarget(player) : void 0;
      if (identity === "jue" && !levyTarget) return;
      let resolution = getIdentityRepeatResolution(previous, identity);
      if (resolution.requiresDiscard) {
        const discardResult = await player.chooseToDiscard("he", `跨角：弃置一张牌并继续保持“${getIdentityLabel(identity)}”，或取消并改选身份`).set("ai", (card) => 6 - get.value(card)).forResult();
        resolution = getIdentityRepeatResolution(previous, identity, Boolean(discardResult.bool));
      }
      if (resolution.requiresDifferentChoice && previous) {
        identity = await chooseIdentity(player, previous);
        if (!identity) return;
        levyTarget = identity === "jue" ? await chooseJueTarget(player) : void 0;
        if (identity === "jue" && !levyTarget) return;
        resolution = getIdentityRepeatResolution(previous, identity);
      }
      player.storage[KUAJUE_IDENTITY] = identity;
      if (levyTarget) player.storage[KUAJUE_JUE_TARGET] = levyTarget;
      else delete player.storage[KUAJUE_JUE_TARGET];
      player.syncStorage(KUAJUE_IDENTITY);
      player.syncStorage(KUAJUE_JUE_TARGET);
      updateIdentityMark(player, identity);
      setSex(player, identity);
      game.log(player, "选择了", `#y${getIdentityLabel(identity)}`, "身份，性别改为", `#y${getSexLabel(identity)}`);
      if (levyTarget) game.log(levyTarget, "成为了", player, "的征收对象");
      if (resolution.gainKu) player.addMark(XINXIANG_KU, 1);
    },
    intro: {
      content(storage, player) {
        const identity = getIdentity(player);
        if (!identity) return "尚未选择身份";
        let text = `当前身份：${getIdentityLabel(identity)}；当前性别：${getSexLabel(identity)}`;
        const target = player.storage[KUAJUE_JUE_TARGET];
        if (identity === "jue" && target?.isIn()) text += `；征收对象：${get.translation(target)}`;
        return text;
      }
    },
    mod: {
      cardEnabled(card, player) {
        if (getIdentity(player) === "seng" && get.name(card, player) === "sha") return false;
      }
    }
  },
  [KUAJUE_SENG]: {
    sourceSkill: KUAJUE,
    enable: "phaseUse",
    filter(event, player) {
      return getIdentity(player) === "seng" && player.countCards(
        "hes",
        (card) => canUseSengConversion(getIdentity(player), get.suit(card, player), get.number(card, player))
      ) > 0;
    },
    viewAsFilter(player) {
      return getIdentity(player) === "seng" && player.countCards(
        "hes",
        (card) => canUseSengConversion(getIdentity(player), get.suit(card, player), get.number(card, player))
      ) > 0;
    },
    filterCard(card, player) {
      return canUseSengConversion(getIdentity(player), get.suit(card, player), get.number(card, player));
    },
    position: "hes",
    selectCard: 1,
    viewAs: { name: "wuzhong", isCard: true },
    prompt: "将一张点数为2至9的♥牌当【无中生有】使用",
    check(card) {
      const player = get.player();
      return isSafeSengCard(player, card) ? 9 - get.value(card, player) : -20;
    },
    ai: {
      order: 7.5,
      result: { player: 1 }
    }
  },
  [KUAJUE_DAN]: {
    sourceSkill: KUAJUE,
    trigger: { source: "damageBegin1" },
    forced: true,
    usable: 1,
    filter(event, player) {
      return canBoostDanDamage(getIdentity(player), event.player?.sex, player.getStat("skill")[KUAJUE_DAN] ?? 0);
    },
    logTarget: "player",
    async content(event, trigger, player) {
      trigger.num++;
    },
    ai: { damageBonus: true }
  },
  [KUAJUE_SHI]: {
    sourceSkill: KUAJUE,
    trigger: { player: "useCardAfter" },
    forced: true,
    filter(event, player) {
      return shouldTriggerShi(getIdentity(player), player.isPhaseUsing(), get.type(event.card, player));
    },
    async content(event, trigger, player) {
      await player.draw();
    }
  },
  [KUAJUE_JUE]: {
    sourceSkill: KUAJUE,
    trigger: { global: JUE_GAIN_TRIGGERS },
    forced: true,
    filter(event, player) {
      const target = player.storage[KUAJUE_JUE_TARGET];
      if (!target?.isIn()) return false;
      const gained = event.getg?.(target)?.length ?? 0;
      return shouldLevyJueGain(getIdentity(player), true, gained, target.countCards("h"), player.countCards("h"));
    },
    logTarget(event, player) {
      return player.storage[KUAJUE_JUE_TARGET];
    },
    async content(event, trigger, player) {
      const target = player.storage[KUAJUE_JUE_TARGET];
      if (!target?.isIn() || !target.countCards("h") || target.countCards("h") <= player.countCards("h")) return;
      const result = await target.chooseCard("h", true, `爵：选择一张手牌交给${get.translation(player)}`).set("ai", (card) => {
        const target2 = get.player();
        return get.attitude(target2, player) > 0 ? get.value(card, player) : 7 - get.value(card, target2);
      }).forResult();
      if (result.cards?.length) await target.give(result.cards, player);
    }
  },
  [KUAJUE_SEX]: {
    charlotte: true,
    mark: true,
    marktext: "X",
    intro: {
      name: "当前性别",
      content(storage, player) {
        const identity = getIdentity(player);
        return identity ? `当前性别：${getSexLabel(identity)}` : "当前性别：X";
      }
    }
  },
  [ZHENGQUAN]: {
    enable: "phaseUse",
    usable: 1,
    group: ZHENGQUAN_BOOST,
    filter(event, player) {
      return player.countMark(XINXIANG_KU) > 0 && game.hasPlayer((target) => isEligibleZhengquanTarget(player, target));
    },
    filterTarget(card, player, target) {
      return isEligibleZhengquanTarget(player, target);
    },
    selectTarget: 1,
    async content(event, trigger, player) {
      const target = event.targets[0];
      player.removeMark(XINXIANG_KU, 1);
      const result = await player.chooseToCompare(target).set("ai", (card) => get.number(card, player)).forResult();
      if (result.bool && result.target && get.position(result.target) === "d") {
        await player.gain(result.target, "gain2", "log");
      }
    },
    ai: {
      order: 5.5,
      result: {
        target(player, target) {
          if (get.attitude(player, target) >= 0) return 0;
          const maxNumber = Math.max(0, ...player.getCards("h").map((card) => get.number(card, player)));
          const ku = player.countMark(XINXIANG_KU);
          if (!shouldUseZhengquan(maxNumber, target.countCards("h"), ku)) return 0;
          const needed = getRequiredZhengquanBoost(maxNumber, estimateHighestPindianNumber(target.countCards("h")));
          return -(6 - Math.min(4, needed) + (target.hp <= 2 ? 0.75 : 0));
        }
      }
    }
  },
  [ZHENGQUAN_BOOST]: {
    trigger: { player: "compare" },
    forced: true,
    popup: false,
    filter(event, player) {
      return event.getParent()?.name === ZHENGQUAN && player.countMark(XINXIANG_KU) > 0;
    },
    async content(event, trigger, player) {
      const ku = player.countMark(XINXIANG_KU);
      const controls = getPindianBoostControls(ku);
      const result = await player.chooseControl({
        controls,
        prompt: `争权：你的拼点点数为${trigger.num1}，对方为${trigger.num2}；是否追加“酷”？`,
        ai() {
          const evt = get.event();
          const needed = Math.max(0, evt.num2 - evt.num1 + 1);
          return needed > 0 && needed <= evt.ku ? evt.controls[needed] : evt.controls[0];
        }
      }).set("num1", trigger.num1).set("num2", trigger.num2).set("ku", ku).forResult();
      const spent = getPindianBoostAmount(result.control, ku);
      if (!spent) return;
      player.removeMark(XINXIANG_KU, spent);
      trigger.num1 = getBoostedPindianNumber(trigger.num1, spent);
      game.log(player, "额外移去了", `#y${spent}枚“酷”`, "，拼点点数增加", `#y${spent}`);
    }
  },
  [XINXIANG_KU]: {
    charlotte: true,
    mark: true,
    marktext: "酷",
    intro: {
      name: "酷",
      content(storage) {
        return `共有${storage || 0}枚“酷”`;
      }
    }
  }
};
export {
  XINXIANG_KU,
  skills as default
};
//# sourceMappingURL=skills.js.map
