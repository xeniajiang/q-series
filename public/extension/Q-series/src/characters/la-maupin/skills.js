import { game, get, lib } from "noname";
import { shouldIgnoreShaCount, recordJuewuTargets, getLaMaupinAttackRange, getCurrentJuewuTargets, shouldGainKuFromSword } from "./rules.js";
const LA_MAUPIN_KU = "q_la_maupin_ku";
const JUEWU_TAG = "q_la_maupin_juewu";
const JUEWU_USED = "q_la_maupin_juewu_used";
const KUANGMING = "q_la_maupin_kuangming";
const YUJU_KU_GAINED = "q_la_maupin_yuju_ku_gained";
const DRAW_THREE = "摸三张牌";
const RECOVER_ONE = "回复1点体力";
function isJuewuSha(card) {
  return card?.name === "sha" && Boolean(card.storage?.[JUEWU_TAG]);
}
function getJuewuTargets(player) {
  return getCurrentJuewuTargets(player.storage[JUEWU_USED], game.phaseNumber);
}
function cixiongCheck(event, player) {
  return lib.skill.cixiong_skill.check(event, player);
}
async function resolveLaMaupinCixiong(event, trigger, player) {
  await lib.skill.cixiong_skill.content(event, trigger, player);
  const isKuangmingAwakened = player.awakenedSkills.includes(KUANGMING);
  const hasGainedKuThisTurn = player.storage[YUJU_KU_GAINED] === game.phaseNumber;
  if (shouldGainKuFromSword(isJuewuSha(trigger.card), isKuangmingAwakened, hasGainedKuThisTurn)) {
    player.addMark(LA_MAUPIN_KU, 1);
    if (isKuangmingAwakened) {
      player.storage[YUJU_KU_GAINED] = game.phaseNumber;
      player.syncStorage(YUJU_KU_GAINED);
    }
  }
}
const skills = {
  q_la_maupin_yuju: {
    locked: true,
    mark: true,
    marktext: "剑",
    intro: {
      name: "逾矩·额外的雌雄双股剑",
      content: "你拥有一把不占用装备栏、技能无视性别的【雌雄双股剑】。"
    },
    group: ["q_la_maupin_yuju_virtual", "q_la_maupin_yuju_equipped"],
    init(player, skill) {
      player.addSkillBlocker(skill);
    },
    onremove(player, skill) {
      player.removeSkillBlocker(skill);
    },
    skillBlocker(skill) {
      return skill === "cixiong_skill";
    },
    mod: {
      attackRangeFinal(player, range) {
        return getLaMaupinAttackRange(range, Boolean(player.getVEquip("cixiong")));
      }
    },
    subSkill: {
      virtual: {
        audio: "cixiong_skill",
        trigger: { player: "useCardToPlayered" },
        logTarget: "target",
        prompt: "是否发动额外的【雌雄双股剑】？",
        prompt2: "令目标弃置一张手牌，否则你摸一张牌；若并非由“决舞”触发，你获得1枚“酷”（“狂名”觉醒后每回合限一次）。",
        check: cixiongCheck,
        filter(event) {
          return event.card.name === "sha";
        },
        async content(event, trigger, player) {
          await resolveLaMaupinCixiong(event, trigger, player);
        }
      },
      equipped: {
        audio: "cixiong_skill",
        trigger: { player: "useCardToPlayered" },
        logTarget: "target",
        prompt: "是否发动武器栏中的【雌雄双股剑】？",
        prompt2: "令目标弃置一张手牌，否则你摸一张牌；若并非由“决舞”触发，你获得1枚“酷”（“狂名”觉醒后每回合限一次）。",
        check: cixiongCheck,
        filter(event, player) {
          return event.card.name === "sha" && Boolean(player.getVEquip("cixiong"));
        },
        async content(event, trigger, player) {
          await resolveLaMaupinCixiong(event, trigger, player);
        }
      }
    }
  },
  q_la_maupin_kuangming: {
    trigger: { player: "phaseZhunbeiBegin" },
    forced: true,
    juexingji: true,
    skillAnimation: true,
    animationColor: "fire",
    filter(event, player) {
      return player.countMark(LA_MAUPIN_KU) >= 4;
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name);
      await player.loseMaxHp();
      const { control } = await player.chooseControl({
        controls: [RECOVER_ONE, DRAW_THREE],
        prompt: "狂名：回复1点体力，或摸三张牌",
        ai() {
          const player2 = get.player();
          return player2.isDamaged() && player2.hp <= 2 ? RECOVER_ONE : DRAW_THREE;
        }
      }).forResult();
      if (control === RECOVER_ONE) {
        await player.recover();
      } else {
        await player.draw(3);
      }
      await player.addSkills("q_la_maupin_juewu");
    }
  },
  q_la_maupin_juewu: {
    enable: ["chooseToUse", "chooseToRespond"],
    hiddenCard(player, name) {
      return name === "sha" && player.countMark(LA_MAUPIN_KU) > 0;
    },
    filter(event, player) {
      const card = { name: "sha", isCard: true, storage: { [JUEWU_TAG]: true } };
      return player.countMark(LA_MAUPIN_KU) > 0 && event.filterCard(card, player, event);
    },
    viewAsFilter(player) {
      return player.countMark(LA_MAUPIN_KU) > 0;
    },
    filterCard: () => false,
    selectCard: -1,
    viewAs: {
      name: "sha",
      isCard: true,
      storage: { [JUEWU_TAG]: true }
    },
    prompt: "移去1枚“酷”，视为使用或打出一张【杀】",
    log: false,
    async precontent(event, trigger, player) {
      const targets = event.result.targets || [];
      player.logSkill("q_la_maupin_juewu", targets);
      player.removeMark(LA_MAUPIN_KU, 1);
      const targetIds = targets.map((target) => target.playerid);
      if (!targetIds.length) {
        return;
      }
      const usedTargets = getJuewuTargets(player);
      if (shouldIgnoreShaCount(targetIds, usedTargets)) {
        event.getParent().addCount = false;
      }
      player.storage[JUEWU_USED] = recordJuewuTargets(game.phaseNumber, usedTargets, targetIds);
      player.syncStorage(JUEWU_USED);
    },
    mod: {
      cardUsableTarget(card, player, target) {
        if (isJuewuSha(card) && !getJuewuTargets(player).includes(target.playerid)) {
          return true;
        }
      }
    },
    ai: {
      respondSha: true,
      skillTagFilter(player) {
        return player.countMark(LA_MAUPIN_KU) > 0;
      },
      result: { player: 1 }
    }
  },
  [LA_MAUPIN_KU]: {
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
  LA_MAUPIN_KU,
  skills as default
};
//# sourceMappingURL=skills.js.map
