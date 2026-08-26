const XINXIANG_IDENTITIES = ["seng", "dan", "shi", "jue"];
const IDENTITY_SELECTION_TRIGGERS = ["phaseDrawEnd"];
const JUE_GAIN_TRIGGERS = ["gainAfter", "loseAsyncAfter"];
const IDENTITY_AI_ORDER = ["shi", "seng", "jue", "dan"];
function chooseIdentityByOpportunity(legalIdentities, current, levels) {
  const legal = IDENTITY_AI_ORDER.filter((identity) => legalIdentities.includes(identity));
  if (!legal.length) return void 0;
  const maxLevel = Math.max(...legal.map((identity) => levels[identity] ?? 0));
  if (maxLevel > 0) {
    return legal.find((identity) => identity !== current && levels[identity] === maxLevel) ?? legal.find((identity) => levels[identity] === maxLevel);
  }
  return legal.find((identity) => identity !== current) ?? legal[0];
}
function estimateJueTaxes(ownerHand, targetHand, extraGainEvents = 0) {
  let owner = Math.max(0, Math.trunc(ownerHand));
  let target = Math.max(0, Math.trunc(targetHand));
  let taxes = 0;
  const gain = (amount) => {
    target += amount;
    if (target > owner) {
      taxes++;
      target--;
      owner++;
    }
  };
  gain(2);
  for (let index = 0; index < Math.max(0, Math.trunc(extraGainEvents)); index++) gain(1);
  return taxes;
}
function estimateHighestPindianNumber(handcardCount) {
  const count = Math.max(1, Math.trunc(handcardCount));
  return Math.min(13, Math.ceil(13 * count / (count + 1)));
}
function getRequiredZhengquanBoost(selfNumber, targetNumber) {
  return Math.max(0, Math.trunc(targetNumber) - Math.trunc(selfNumber) + 1);
}
function shouldUseZhengquan(selfNumber, targetHandcardCount, ku) {
  if (ku <= 0 || selfNumber <= 0 || targetHandcardCount <= 0) return false;
  return getRequiredZhengquanBoost(selfNumber, estimateHighestPindianNumber(targetHandcardCount)) <= ku - 1;
}
const IDENTITY_LABELS = {
  seng: "僧",
  dan: "旦",
  shi: "士",
  jue: "爵"
};
function getIdentityLabel(identity) {
  return IDENTITY_LABELS[identity];
}
function getIdentityFromLabel(label) {
  return XINXIANG_IDENTITIES.find((identity) => IDENTITY_LABELS[identity] === label);
}
function getIdentitySex(identity) {
  if (identity === "seng") return "unknown";
  if (identity === "dan") return "female";
  return "male";
}
function getIdentityRepeatResolution(previous, next, discardedForSameIdentity = false) {
  if (previous === void 0) {
    return { requiresDiscard: false, requiresDifferentChoice: false, gainKu: false };
  }
  if (previous !== next) {
    return { requiresDiscard: false, requiresDifferentChoice: false, gainKu: true };
  }
  return {
    requiresDiscard: true,
    requiresDifferentChoice: !discardedForSameIdentity,
    gainKu: !discardedForSameIdentity
  };
}
function canBoostDanDamage(identity, targetSex, usesThisTurn) {
  return identity === "dan" && targetSex === "male" && usesThisTurn < 1;
}
function canUseSengConversion(identity, suit, number) {
  return identity === "seng" && suit === "heart" && number >= 2 && number <= 9;
}
function shouldTriggerShi(identity, isPhaseUsing, cardType) {
  return identity === "shi" && isPhaseUsing && cardType === "trick";
}
function shouldLevyJueGain(identity, isChosenTarget, gainedCardCount, targetHandcardCount, ownerHandcardCount) {
  return identity === "jue" && isChosenTarget && gainedCardCount > 0 && targetHandcardCount > ownerHandcardCount;
}
function getPindianBoostControls(ku) {
  const count = Math.max(0, Math.trunc(ku));
  return ["不追加", ...Array.from({ length: count }, (_, index) => `${index + 1}枚`)];
}
function getPindianBoostAmount(control, ku) {
  if (control === "不追加") return 0;
  const amount = Number.parseInt(control, 10);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, Math.min(Math.trunc(ku), amount));
}
function getBoostedPindianNumber(baseNumber, spentKu) {
  return Math.trunc(baseNumber) + Math.max(0, Math.trunc(spentKu));
}
function isZhengquanTarget(candidate, allPlayers) {
  if (candidate.handcardCount <= 0 || allPlayers.length === 0) return false;
  const highestHp = Math.max(...allPlayers.map((player) => player.hp));
  const mostHandcards = Math.max(...allPlayers.map((player) => player.handcardCount));
  return candidate.hp === highestHp || candidate.handcardCount === mostHandcards;
}
export {
  IDENTITY_SELECTION_TRIGGERS,
  JUE_GAIN_TRIGGERS,
  XINXIANG_IDENTITIES,
  canBoostDanDamage,
  canUseSengConversion,
  chooseIdentityByOpportunity,
  estimateHighestPindianNumber,
  estimateJueTaxes,
  getBoostedPindianNumber,
  getIdentityFromLabel,
  getIdentityLabel,
  getIdentityRepeatResolution,
  getIdentitySex,
  getPindianBoostAmount,
  getPindianBoostControls,
  getRequiredZhengquanBoost,
  isZhengquanTarget,
  shouldLevyJueGain,
  shouldTriggerShi,
  shouldUseZhengquan
};
//# sourceMappingURL=rules.js.map
