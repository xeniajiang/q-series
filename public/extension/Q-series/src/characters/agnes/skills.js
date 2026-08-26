import { get } from "noname";
import { getKeshuDrawCount, shouldTriggerKeshu, getRecoveryControls, getActualRemovedKu, canUseLimitedRecovery, shouldUseKuAsShanAi, canUseKuAsShan, getEntryControls, shouldChooseEntryCard, grantsRepeatedResearchDraw, getEntryTargetAiScore, isEntryTarget } from "./rules.js";
const AGNES_KU = "q_agnes_ku";
const AGNES_YAN = "q_agnes_yan";
const CHENGSHEN_RECOVER = "q_agnes_chengshen_recover";
const CHENGSHEN_RECOVER_USED = "q_agnes_chengshen_recover_used";
const ENTRY_GAIN = "获得一张手牌";
const skills = {
  q_agnes_ruju: {
    trigger: { player: "phaseZhunbeiBegin" },
    async cost(event, trigger, player) {
      event.result = await player.chooseTarget({
        prompt: get.prompt2(event.skill),
        filterTarget(card, player2, target) {
          return target !== player2 && isEntryTarget({ hp: player2.hp, handcardCount: player2.countCards("h") }, { hp: target.hp, handcardCount: target.countCards("h") });
        },
        ai(target) {
          const player2 = get.player();
          return getEntryTargetAiScore(
            target.countMark(AGNES_YAN),
            target.hp - player2.hp,
            target.countCards("h") - player2.countCards("h"),
            get.attitude(player2, target)
          );
        }
      }).forResult();
    },
    async content(event, trigger, player) {
      const target = event.targets[0];
      const controls = getEntryControls(player.countCards("h"));
      const { control } = await target.chooseControl({
        controls,
        prompt: `入局：请选择${get.translation(target)}执行的选项`,
        ai() {
          const { player: target2, source, controls: controls2 } = get.event();
          if (!controls2.includes(ENTRY_GAIN)) {
            return controls2[0];
          }
          return shouldChooseEntryCard(get.attitude(target2, source), source.countCards("h") > 0) ? ENTRY_GAIN : "摸一张牌";
        }
      }).set("source", player).forResult();
      if (control === ENTRY_GAIN && player.countCards("h") > 0) {
        const result = await player.chooseCard("h", true, `入局：选择交给${get.translation(target)}的一张手牌`).set("target", target).set("ai", (card) => {
          const { player: player2, target: target2 } = get.event();
          return get.attitude(player2, target2) > 0 ? get.value(card, target2) : 7 - get.value(card, target2);
        }).forResult();
        if (result.cards?.length) {
          await player.give(result.cards, target);
        } else {
          await target.draw();
        }
      } else {
        await target.draw();
      }
      const previousResearch = target.countMark(AGNES_YAN);
      player.addMark(AGNES_KU, 1);
      target.addMark(AGNES_YAN, 1);
      if (grantsRepeatedResearchDraw(previousResearch)) {
        await player.draw();
      }
    }
  },
  q_agnes_chengshen: {
    group: ["q_agnes_chengshen_shan", "q_agnes_chengshen_recover"],
    subSkill: {
      shan: {
        enable: ["chooseToUse", "chooseToRespond"],
        hiddenCard(player, name) {
          return name === "shan" && canUseKuAsShan(player.countMark(AGNES_KU));
        },
        filter(event, player) {
          return canUseKuAsShan(player.countMark(AGNES_KU)) && event.filterCard({ name: "shan", isCard: true }, player, event);
        },
        viewAsFilter(player) {
          return canUseKuAsShan(player.countMark(AGNES_KU));
        },
        filterCard: () => false,
        selectCard: -1,
        viewAs: { name: "shan", isCard: true },
        prompt: "移去一枚“酷”，视为使用或打出一张【闪】",
        log: false,
        async precontent(event, trigger, player) {
          player.logSkill("q_agnes_chengshen");
          player.removeMark(AGNES_KU, 1);
        },
        ai: {
          respondShan: true,
          skillTagFilter(player) {
            return shouldUseKuAsShanAi(player.countMark(AGNES_KU), player.countCards("hs", "shan"));
          },
          result: { player: 1 }
        }
      },
      recover: {
        enable: "phaseUse",
        limited: true,
        skillAnimation: true,
        animationColor: "water",
        filter(event, player) {
          return canUseLimitedRecovery(
            player.countMark(AGNES_KU),
            player.hp,
            player.maxHp,
            Boolean(player.storage[CHENGSHEN_RECOVER_USED])
          );
        },
        async content(event, trigger, player) {
          const controls = getRecoveryControls(player.countMark(AGNES_KU));
          const { control } = await player.chooseControl({
            controls,
            prompt: "成身：选择要移去的“酷”数量",
            ai() {
              const player2 = get.player();
              return `${Math.max(1, Math.min(player2.countMark(AGNES_KU), player2.maxHp - player2.hp))}枚`;
            }
          }).forResult();
          const chosen = Number.parseInt(control, 10);
          const removed = getActualRemovedKu(chosen, player.countMark(AGNES_KU));
          player.storage[CHENGSHEN_RECOVER_USED] = true;
          player.syncStorage(CHENGSHEN_RECOVER_USED);
          player.awakenSkill(CHENGSHEN_RECOVER);
          if (removed > 0) {
            player.removeMark(AGNES_KU, removed);
            await player.recover(removed);
          }
        },
        ai: {
          order: 10,
          result: {
            player(player) {
              return Math.min(player.countMark(AGNES_KU), player.maxHp - player.hp);
            }
          }
        }
      }
    }
  },
  q_agnes_keshu: {
    trigger: { global: "useCardAfter" },
    forced: true,
    filter(event, player) {
      return shouldTriggerKeshu(event.player !== player, get.type2(event.card), event.player?.countMark(AGNES_YAN) ?? 0);
    },
    async content(event, trigger, player) {
      await player.draw(getKeshuDrawCount(Boolean(player.storage[CHENGSHEN_RECOVER_USED])));
    }
  },
  [AGNES_KU]: {
    charlotte: true,
    mark: true,
    marktext: "酷",
    intro: {
      name: "酷",
      content(storage) {
        return `共有${storage || 0}枚“酷”`;
      }
    }
  },
  [AGNES_YAN]: {
    charlotte: true,
    mark: true,
    marktext: "研",
    intro: {
      name: "研",
      content(storage) {
        return `共有${storage || 0}枚“研”`;
      }
    }
  }
};
export {
  AGNES_KU,
  AGNES_YAN,
  skills as default
};
//# sourceMappingURL=skills.js.map
