import { get, lib, game } from "noname";
import { BARBIN_TARGET_EVENT, BARBIN_SKILL_TARGET_EVENTS, shouldCancelWithYushen, getYushenDrawCount, canUseWithinRound, isDesignationSkillTarget, shouldRejectDesignation, recordRoundUse, getInterventionOutcome, chooseDesignationDeclaration, getDesignationRejectionOutcome, shouldTriggerRejectionMilestone, canGainDesignationMark, getCriticalDesignationKu } from "./rules.js";
const BARBIN_KU = "q_barbin_ku";
const BARBIN_MALE = "q_barbin_male";
const BARBIN_FEMALE = "q_barbin_female";
const ZHIPAI = "q_barbin_zhipai";
const ZHIPAI_SKILL_TARGET = "q_barbin_zhipai_skill_target";
const ZIMING = "q_barbin_ziming";
const GANYU = "q_barbin_ganyu";
const YUSHEN = "q_barbin_yushen";
const SEX_MARK = "q_barbin_sex";
const ZHIPAI_ROUND = "q_barbin_zhipai_round";
const ZHIPAI_MILESTONE = "q_barbin_zhipai_milestone";
const YUSHEN_ROUND = "q_barbin_yushen_round";
let evaluatingDesignationEffect = false;
function getSexLabel(sex) {
  if (sex === "male") return "男";
  if (sex === "female") return "女";
  return "X";
}
function setBarbinSex(player, sex) {
  game.broadcastAll(
    (player2, sex2, label) => {
      player2.sex = sex2;
      const mark = player2.marks?.[SEX_MARK];
      if (mark?.firstChild) mark.firstChild.innerHTML = label;
    },
    player,
    sex,
    getSexLabel(sex)
  );
  player.markSkill(SEX_MARK);
  game.broadcastAll(
    (player2, label) => {
      const mark = player2.marks?.[SEX_MARK];
      if (mark?.firstChild) mark.firstChild.innerHTML = label;
    },
    player,
    getSexLabel(sex)
  );
}
function clearDesignationMarks(player) {
  const male = player.countMark(BARBIN_MALE);
  const female = player.countMark(BARBIN_FEMALE);
  if (male > 0) player.removeMark(BARBIN_MALE, male);
  if (female > 0) player.removeMark(BARBIN_FEMALE, female);
  player.unmarkSkill(BARBIN_MALE);
  player.unmarkSkill(BARBIN_FEMALE);
}
function getRoundNumber() {
  return game.roundNumber || 0;
}
function getRoundRecord(player, key) {
  return player.storage[key];
}
function recordPlayerRoundUse(player, key) {
  player.storage[key] = recordRoundUse(getRoundRecord(player, key), getRoundNumber());
  player.syncStorage(key);
}
function hasCixiongImmediateEffect(source, card, declaredSex) {
  return card?.name === "sha" && source.hasSkill("cixiong_skill") && (source.sex === "male" || source.sex === "female") && declaredSex !== "unknown" && source.sex !== declaredSex;
}
function hasXinxiangDanImmediateEffect(source, card, declaredSex) {
  return declaredSex === "male" && Boolean(get.tag(card, "damage")) && source.storage?.q_xinxiang_kuajue_identity === "dan" && (source.getStat("skill")?.q_xinxiang_kuajue_dan ?? 0) < 1;
}
function evaluateImmediateEffect(source, target, card, declaredSex) {
  if (evaluatingDesignationEffect) return 0;
  const originalSex = target.sex;
  let effect = 0;
  try {
    evaluatingDesignationEffect = true;
    target.sex = declaredSex;
    effect = get.effect(target, card, source, target);
    if (hasCixiongImmediateEffect(source, card, declaredSex)) effect -= 1.5;
    if (hasXinxiangDanImmediateEffect(source, card, declaredSex)) {
      effect += get.damageEffect(target, source, target);
    }
  } finally {
    target.sex = originalSex;
    evaluatingDesignationEffect = false;
  }
  return effect;
}
function isCriticalDiscard(card, player) {
  const name = get.name(card, player);
  if (name === "tao" && player.isDamaged()) return true;
  if (name === "shan" && player.hp <= 2 && player.countCards("h", "shan") <= 1) return true;
  return name === "jiu" && player.hp <= 1;
}
function restoreSexAfterCard(player, useCardEvent) {
  player.when({
    target: ["useCardToAfter", "useCardToExcluded", "useCardToOmitted", "useCardToCancelled"],
    global: "useCardAfter"
  }).filter((event) => event === useCardEvent || event.getParent?.() === useCardEvent).assign({ lastDo: true, popup: false }).then(async (event, trigger, player2) => {
    setBarbinSex(player2, "unknown");
  });
}
function restoreSexAfterSkill(player, skillEvent) {
  const finishEvent = skillEvent.name === "useSkill" ? "useSkillAfter" : "logSkill";
  player.when({ global: finishEvent }).filter((event) => {
    if (event.player !== skillEvent.player || event.skill !== skillEvent.skill) return false;
    if (finishEvent === "logSkill") return event.log_event === skillEvent.log_event;
    return true;
  }).assign({ lastDo: true, popup: false }).then(async (event, trigger, player2) => {
    setBarbinSex(player2, "unknown");
  });
}
async function performDesignation(player, source, subject, card, restoreAccepted) {
  recordPlayerRoundUse(player, ZHIPAI_ROUND);
  const immediateEffect = (sex) => card ? evaluateImmediateEffect(source, player, card, sex) : 0;
  const maleImmediateEffect = immediateEffect("male");
  const femaleImmediateEffect = immediateEffect("female");
  const preferredDeclaration = chooseDesignationDeclaration({
    isFriendly: get.attitude(source, player) > 0,
    maleMarks: player.countMark(BARBIN_MALE),
    femaleMarks: player.countMark(BARBIN_FEMALE),
    maleImmediateEffect,
    femaleImmediateEffect,
    tieSex: Math.random() < 0.5 ? "male" : "female"
  });
  const declaration = await source.chooseControl({
    controls: ["男", "女"],
    prompt: `指派：声明${get.translation(player)}于${subject}结算期间的性别`,
    ai() {
      return get.event().preferredDeclaration;
    }
  }).set("preferredDeclaration", getSexLabel(preferredDeclaration)).forResult();
  const declaredSex = declaration.control === "女" ? "female" : "male";
  game.log(source, "声明", player, "的性别为", `#y${getSexLabel(declaredSex)}`);
  let rejectionOutcome = getDesignationRejectionOutcome(false, 0);
  const discardableCards = player.getCards("h", (current) => lib.filter.cardDiscardable(current, player, ZHIPAI));
  if (discardableCards.length > 0) {
    const nonCritical = discardableCards.filter((current) => !isCriticalDiscard(current, player));
    const shouldReject = shouldRejectDesignation({
      ku: player.countMark(BARBIN_KU),
      maleMarks: player.countMark(BARBIN_MALE),
      femaleMarks: player.countMark(BARBIN_FEMALE),
      declaredSex,
      immediateEffectDifference: immediateEffect(declaredSex) - immediateEffect("unknown"),
      hasNonCriticalDiscard: nonCritical.length > 0,
      lowestNonCriticalDiscardValue: Math.min(Infinity, ...nonCritical.map((current) => get.value(current, player))),
      rejectionMilestoneBenefit: player.isDamaged() ? 2 : 1,
      handcardsAfterDiscard: player.countCards("h") - 1,
      hp: player.hp
    });
    const { bool: confirmed } = await player.chooseBool(`指派：是否弃置一张手牌拒绝“${getSexLabel(declaredSex)}”指派并获得1枚“酷”？`).set("choice", shouldReject).forResult();
    if (confirmed) {
      const chosen = await player.chooseCard({
        position: "h",
        selectCard: 1,
        forced: true,
        prompt: "指派：选择要弃置的手牌",
        filterCard(current, owner) {
          return lib.filter.cardDiscardable(current, owner, ZHIPAI);
        }
      }).set("ai", (current) => {
        const owner = get.player();
        return isCriticalDiscard(current, owner) ? 0.1 : 20 - get.value(current, owner);
      }).forResult();
      if (chosen.bool && chosen.cards?.length) {
        await player.discard(chosen.cards);
        rejectionOutcome = getDesignationRejectionOutcome(true, chosen.cards.length);
      }
    }
  }
  if (rejectionOutcome.rejected) {
    const kuBefore = player.countMark(BARBIN_KU);
    const triggerMilestone = shouldTriggerRejectionMilestone(
      kuBefore,
      rejectionOutcome.kuGained,
      Boolean(player.storage[ZHIPAI_MILESTONE])
    );
    player.addMark(BARBIN_KU, rejectionOutcome.kuGained);
    setBarbinSex(player, "unknown");
    if (triggerMilestone) {
      player.storage[ZHIPAI_MILESTONE] = true;
      player.syncStorage(ZHIPAI_MILESTONE);
      const { control } = await player.chooseControl({
        controls: ["摸一张牌", "回复1点体力"],
        prompt: "指派：首次因拒绝令“酷”数达到3，选择一项",
        ai() {
          return get.player().isDamaged() ? "回复1点体力" : "摸一张牌";
        }
      }).forResult();
      if (control === "回复1点体力") await player.recover();
      else await player.draw();
    }
    return;
  }
  if (canGainDesignationMark(player.countMark(BARBIN_MALE), player.countMark(BARBIN_FEMALE))) {
    player.addMark(declaredSex === "male" ? BARBIN_MALE : BARBIN_FEMALE, 1);
  }
  setBarbinSex(player, declaredSex);
  restoreAccepted();
}
const skills = {
  [ZHIPAI]: {
    locked: true,
    forced: true,
    group: ZHIPAI_SKILL_TARGET,
    trigger: { target: BARBIN_TARGET_EVENT },
    init(player) {
      setBarbinSex(player, "unknown");
    },
    filter(event, player) {
      return event.player !== player && canUseWithinRound(getRoundRecord(player, ZHIPAI_ROUND), getRoundNumber(), 2);
    },
    async content(event, trigger, player) {
      await performDesignation(
        player,
        trigger.player,
        get.translation(trigger.card),
        trigger.card,
        () => restoreSexAfterCard(player, trigger.getParent())
      );
    },
    ai: {
      effect: {
        target_use(card, source, target) {
          if (evaluatingDesignationEffect || source === target) return;
          const maleMarks = target.countMark(BARBIN_MALE);
          const femaleMarks = target.countMark(BARBIN_FEMALE);
          if (maleMarks + femaleMarks !== 2) return;
          if (!canUseWithinRound(getRoundRecord(target, ZHIPAI_ROUND), getRoundNumber(), 2)) return;
          const isFriendly = get.attitude(source, target) > 0;
          const maleImmediateEffect = evaluateImmediateEffect(source, target, card, "male");
          const femaleImmediateEffect = evaluateImmediateEffect(source, target, card, "female");
          const declaredSex = chooseDesignationDeclaration({
            isFriendly,
            maleMarks,
            femaleMarks,
            maleImmediateEffect,
            femaleImmediateEffect,
            tieSex: "male"
          });
          const discardableCards = target.getCards("h", (current) => lib.filter.cardDiscardable(current, target, ZHIPAI));
          const nonCritical = discardableCards.filter((current) => !isCriticalDiscard(current, target));
          const predictsRejection = shouldRejectDesignation({
            ku: target.countMark(BARBIN_KU),
            maleMarks,
            femaleMarks,
            declaredSex,
            immediateEffectDifference: evaluateImmediateEffect(source, target, card, declaredSex) - evaluateImmediateEffect(source, target, card, "unknown"),
            hasNonCriticalDiscard: nonCritical.length > 0,
            lowestNonCriticalDiscardValue: Math.min(Infinity, ...nonCritical.map((current) => get.value(current, target))),
            rejectionMilestoneBenefit: target.isDamaged() ? 2 : 1,
            handcardsAfterDiscard: target.countCards("h") - 1,
            hp: target.hp
          });
          if (predictsRejection) return;
          const interventionKu = getCriticalDesignationKu(maleMarks, femaleMarks, declaredSex) ?? 0;
          let baseEffect = 0;
          try {
            evaluatingDesignationEffect = true;
            baseEffect = get.effect(target, card, source, source);
          } finally {
            evaluatingDesignationEffect = false;
          }
          if (isFriendly) {
            if (baseEffect < -0.5 || get.tag(card, "damage")) return;
            return [1, 0.45 + interventionKu * 0.3];
          }
          return [1, interventionKu === 0 ? 0.25 : 0.1];
        }
      }
    }
  },
  [ZHIPAI_SKILL_TARGET]: {
    sourceSkill: ZHIPAI,
    forced: true,
    popup: false,
    trigger: { global: BARBIN_SKILL_TARGET_EVENTS },
    filter(event, player) {
      return isDesignationSkillTarget(
        event.player !== player,
        Boolean(event.targets?.includes(player)),
        Boolean(event.skill && get.info(event.skill)?.viewAs),
        Boolean(event.skill)
      ) && canUseWithinRound(getRoundRecord(player, ZHIPAI_ROUND), getRoundNumber(), 2);
    },
    async content(event, trigger, player) {
      const subject = `【${get.translation(trigger.skill)}】`;
      await performDesignation(player, trigger.player, subject, void 0, () => restoreSexAfterSkill(player, trigger));
    }
  },
  [ZIMING]: {
    enable: "phaseUse",
    limited: true,
    mark: false,
    skillAnimation: true,
    animationColor: "thunder",
    filter(event, player) {
      return player.countMark(BARBIN_KU) >= 3;
    },
    async content(event, trigger, player) {
      player.awakenSkill(ZIMING);
      clearDesignationMarks(player);
      setBarbinSex(player, "unknown");
      await player.draw(3);
      await player.removeSkills([ZHIPAI, GANYU]);
      await player.addSkills(YUSHEN);
    },
    ai: {
      order: 99,
      result: { player: 10 }
    }
  },
  [GANYU]: {
    trigger: { player: "phaseZhunbeiBegin" },
    forced: true,
    juexingji: true,
    skillAnimation: true,
    animationColor: "fire",
    derivation: YUSHEN,
    filter(event, player) {
      return player.countMark(BARBIN_MALE) + player.countMark(BARBIN_FEMALE) === 3;
    },
    async content(event, trigger, player) {
      player.awakenSkill(GANYU);
      const male = player.countMark(BARBIN_MALE);
      const female = player.countMark(BARBIN_FEMALE);
      const tieSex = Math.random() < 0.5 ? "male" : "female";
      const outcome = getInterventionOutcome(male, female, tieSex);
      setBarbinSex(player, outcome.sex);
      if (outcome.kuGained > 0) player.addMark(BARBIN_KU, outcome.kuGained);
      clearDesignationMarks(player);
      await player.draw(3);
      await player.removeSkills([ZHIPAI, ZIMING]);
      await player.addSkills(YUSHEN);
    }
  },
  [YUSHEN]: {
    group: ["q_barbin_yushen_gain", "q_barbin_yushen_cancel"],
    subSkill: {
      gain: {
        trigger: { target: "useCardToAfter" },
        forced: true,
        filter(event, player) {
          return event.player !== player && canUseWithinRound(getRoundRecord(player, YUSHEN_ROUND), getRoundNumber(), 1);
        },
        async content(event, trigger, player) {
          recordPlayerRoundUse(player, YUSHEN_ROUND);
          player.addMark(BARBIN_KU, 1);
        }
      },
      cancel: {
        trigger: { target: BARBIN_TARGET_EVENT },
        usable: 1,
        filter(event, player) {
          return event.player !== player && player.countMark(BARBIN_KU) > 0;
        },
        async cost(event, trigger, player) {
          const remaining = player.countMark(BARBIN_KU) - 1;
          const draw = getYushenDrawCount(player.sex, remaining);
          const prompt = `余身：是否移去1枚“酷”，取消自己作为${get.translation(trigger.card)}的目标？${draw > 0 ? `然后摸${get.cnNumber(draw)}张牌` : ""}`;
          const { bool } = await player.chooseBool(prompt).set("choice", get.effect(player, trigger.card, trigger.player, player) < 0 || draw > 0).forResult();
          event.result = { bool, cost_data: { confirmed: bool } };
        },
        async content(event, trigger, player) {
          if (!shouldCancelWithYushen(Boolean(event.cost_data?.confirmed), player.countMark(BARBIN_KU))) return;
          player.logSkill(YUSHEN, trigger.player);
          player.removeMark(BARBIN_KU, 1);
          trigger.getParent().excluded.add(player);
          const draw = getYushenDrawCount(player.sex, player.countMark(BARBIN_KU));
          if (draw > 0) await player.draw(draw);
        }
      }
    }
  },
  [SEX_MARK]: {
    charlotte: true,
    mark: true,
    marktext: "X",
    intro: {
      name: "当前性别",
      content(storage, player) {
        return `当前性别：${getSexLabel(player.sex)}`;
      }
    }
  },
  [BARBIN_MALE]: {
    charlotte: true,
    mark: true,
    marktext: "男",
    intro: {
      name: "男",
      content(storage) {
        return `共有${storage || 0}枚“男”标记`;
      }
    }
  },
  [BARBIN_FEMALE]: {
    charlotte: true,
    mark: true,
    marktext: "女",
    intro: {
      name: "女",
      content(storage) {
        return `共有${storage || 0}枚“女”标记`;
      }
    }
  },
  [BARBIN_KU]: {
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
  BARBIN_FEMALE,
  BARBIN_KU,
  BARBIN_MALE,
  skills as default
};
//# sourceMappingURL=skills.js.map
