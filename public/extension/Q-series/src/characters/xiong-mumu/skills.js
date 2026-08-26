import { get, game } from "noname";
import { recordBatchMetric, setBatchMetric } from "../../batch-mode.js";
import { getYihuanRescueKuCost, getKuRescueRecovery, canUseKuRescue, getYihuanPrepDrawCount, getYihuanDrawCount, getLiyeRecipientAiValue, getLiyeAiValue, getLiyeSelfDrawCount, getLiyeDiscardCount, getLiyeDrawCount, getShanyuanOutcome, getShanyuanAiScore, shouldRunAnfaCheck, isAnfaJudgment } from "./rules.js";
const XIONG_YUAN = "q_xiong_yuan";
const XIONG_KU = "q_xiong_ku";
const SHANYUAN = "q_xiong_shanyuan";
const LIYE = "q_xiong_liye";
const ANFA = "q_xiong_anfa";
const YIHUAN = "q_xiong_yihuan";
const ANFA_OCCURRED = "q_xiong_anfa_occurred";
function canGainJudgmentCard(card) {
  return Boolean(card) && ["d", "o"].includes(get.position(card, true));
}
async function gainKuAndCheckAnfa(player) {
  player.addMark(XIONG_KU, 1);
  recordBatchMetric("kuGained");
  if (!shouldRunAnfaCheck("gain", Boolean(player.storage[ANFA_OCCURRED]), player.sex)) {
    return;
  }
  recordBatchMetric("anfaChecks");
  player.logSkill(ANFA);
  const result = await player.judge((card) => isAnfaJudgment(get.suit(card), get.number(card)) ? 2 : -1).forResult();
  if (!isAnfaJudgment(result.suit, result.number)) {
    return;
  }
  player.storage[ANFA_OCCURRED] = true;
  recordBatchMetric("anfaOccurred");
  setBatchMetric("anfaRound", game.roundNumber || 0);
  setBatchMetric("anfaKu", player.countMark(XIONG_KU));
  setBatchMetric(
    "anfaRelatedPlayers",
    game.countPlayer((current) => current !== player && current.countMark(XIONG_YUAN) > 0)
  );
  player.syncStorage(ANFA_OCCURRED);
  game.broadcastAll(
    (player2) => {
      player2.sex = "unknown";
    },
    player
  );
  game.log(player, "的性别由", "#y女", "改为了", "#yX");
  await player.removeSkills([SHANYUAN, LIYE]);
  await player.addSkills(YIHUAN);
}
const skills = {
  [SHANYUAN]: {
    trigger: { player: "phaseZhunbeiBegin" },
    async cost(event, trigger, player) {
      event.result = await player.chooseTarget({
        prompt: get.prompt2(event.skill),
        filterTarget: (card, player2, target) => target !== player2,
        ai(target) {
          const player2 = get.player();
          return getShanyuanAiScore(target.countMark(XIONG_YUAN), get.attitude(player2, target));
        }
      }).forResult();
    },
    async content(event, trigger, player) {
      recordBatchMetric("shanyuanUses");
      const target = event.targets[0];
      const result = await player.judge((card) => get.color(card) === "red" ? 1 : -1).forResult();
      const outcome = getShanyuanOutcome(result.color, target.countMark(XIONG_YUAN));
      const recipient = outcome.recipient === "target" ? target : player;
      if (outcome.gainYuan) {
        target.addMark(XIONG_YUAN, 1);
      }
      if (canGainJudgmentCard(result.card)) {
        await recipient.gain(result.card, "gain2", "log");
      }
    }
  },
  [LIYE]: {
    enable: "phaseUse",
    usable: 1,
    group: "q_xiong_liye_rescue",
    filter(event, player) {
      return game.hasPlayer((current) => current !== player && current.countMark(XIONG_YUAN) > 0);
    },
    async content(event, trigger, player) {
      recordBatchMetric("liyeUses");
      const related = game.filterPlayer((current) => current !== player && current.countMark(XIONG_YUAN) > 0);
      const selfDraw = getLiyeSelfDrawCount(related.length);
      recordBatchMetric("liyeSelfDraw", selfDraw);
      await player.draw(selfDraw);
      const discardCount = getLiyeDiscardCount(player.countCards("h"));
      if (discardCount > 0) {
        await player.chooseToDiscard({
          position: "h",
          selectCard: discardCount,
          forced: true,
          prompt: `立业：尽可能弃置两张手牌（当前弃置${get.cnNumber(discardCount)}张）`
        });
      }
      const result = await player.chooseTarget({
        prompt: "立业：选择一名拥有“缘”的其他角色",
        forced: true,
        filterTarget: (card, player2, target) => target !== player2 && target.countMark(XIONG_YUAN) > 0,
        ai(target) {
          const player2 = get.player();
          return getLiyeRecipientAiValue(target.countMark(XIONG_YUAN), get.attitude(player2, target));
        }
      }).forResult();
      if (result.targets?.length) {
        const target = result.targets[0];
        const targetDraw = getLiyeDrawCount(target.countMark(XIONG_YUAN));
        recordBatchMetric("liyeTargetDraw", targetDraw);
        await target.draw(targetDraw);
      }
      await gainKuAndCheckAnfa(player);
    },
    subSkill: {
      rescue: {
        charlotte: true,
        trigger: { player: "dying" },
        direct: true,
        filter(event, player) {
          return canUseKuRescue(player.countMark(XIONG_KU), player.hp);
        },
        async content(event, trigger, player) {
          const { bool } = await player.chooseBool("是否移去1枚“酷”，将体力回复至1点？").set("ai", () => true).forResult();
          if (!bool) return;
          player.logSkill(LIYE);
          player.removeMark(XIONG_KU, 1);
          recordBatchMetric("kuRescues");
          const recovery = getKuRescueRecovery(player.hp);
          if (recovery > 0) await player.recover(recovery);
        }
      }
    },
    ai: {
      order: 7,
      result: {
        player(player) {
          const related = game.filterPlayer((current) => current !== player && current.countMark(XIONG_YUAN) > 0);
          const bestTarget = Math.max(...related.map((target) => getLiyeRecipientAiValue(target.countMark(XIONG_YUAN), get.attitude(player, target))));
          return getLiyeAiValue(related.length, bestTarget) > 0 ? 1 : 0;
        }
      }
    }
  },
  [ANFA]: {
    locked: true,
    forced: true,
    derivation: YIHUAN
  },
  [YIHUAN]: {
    trigger: { global: "damageEnd" },
    direct: true,
    group: ["q_xiong_yihuan_draw", "q_xiong_yihuan_rescue"],
    filter(event, player) {
      if (!event.source?.isIn()) return false;
      if (event.source === player && event.player !== player) {
        return event.player?.isIn() && event.player.countMark(XIONG_YUAN) > 0;
      }
      return event.player === player && event.source !== player && event.source.countMark(XIONG_YUAN) > 0;
    },
    async content(event, trigger, player) {
      const source = trigger.source;
      const related = source === player ? trigger.player : source;
      const num = getYihuanDrawCount(related.countMark(XIONG_YUAN));
      const { bool } = await source.chooseBool(`遗患：是否移去${get.translation(related)}的所有“缘”，然后摸${get.cnNumber(num)}张牌？`).set("ai", () => true).forResult();
      if (!bool) return;
      player.logSkill(YIHUAN, related);
      related.removeMark(XIONG_YUAN, num);
      recordBatchMetric("yihuanUses");
      recordBatchMetric("yihuanDraw", num);
      await source.draw(num);
    },
    subSkill: {
      draw: {
        trigger: { player: "phaseZhunbeiBegin" },
        forced: true,
        filter(event, player) {
          return getYihuanPrepDrawCount(player.countMark(XIONG_KU)) > 0;
        },
        async content(event, trigger, player) {
          recordBatchMetric("yihuanPrepDraw");
          await player.draw();
        }
      },
      rescue: {
        trigger: { player: "dying" },
        direct: true,
        filter(event, player) {
          return canUseKuRescue(player.countMark(XIONG_KU), player.hp);
        },
        async content(event, trigger, player) {
          const ku = getYihuanRescueKuCost(player.countMark(XIONG_KU));
          const { bool } = await player.chooseBool(`是否移去所有${get.cnNumber(ku)}枚“酷”，将体力回复至1点？`).set("ai", () => true).forResult();
          if (!bool) return;
          player.logSkill(YIHUAN);
          player.removeMark(XIONG_KU, ku);
          recordBatchMetric("yihuanRescues");
          recordBatchMetric("yihuanRescueKuSpent", ku);
          const recovery = getKuRescueRecovery(player.hp);
          if (recovery > 0) await player.recover(recovery);
        }
      }
    }
  },
  [XIONG_YUAN]: {
    charlotte: true,
    mark: true,
    marktext: "缘",
    intro: {
      name: "缘",
      content(storage) {
        return `共有${storage || 0}枚“缘”（至多为3）`;
      }
    }
  },
  [XIONG_KU]: {
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
  XIONG_KU,
  XIONG_YUAN,
  skills as default
};
//# sourceMappingURL=skills.js.map
