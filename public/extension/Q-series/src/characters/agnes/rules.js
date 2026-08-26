function isEntryTarget(agnes, target) {
  return target.hp > agnes.hp || target.handcardCount > agnes.handcardCount;
}
function getEntryTargetAiScore(research, hpAdvantage, handAdvantage, attitude) {
  const normalizedResearch = Math.max(0, Math.trunc(research));
  const researchValue = normalizedResearch === 1 ? 30 : normalizedResearch >= 2 ? 20 : 0;
  const differenceValue = (Math.max(0, hpAdvantage) + Math.max(0, handAdvantage)) * 1.5;
  const allyPreference = Math.max(-5, Math.min(5, attitude)) * 0.35;
  return researchValue + differenceValue + allyPreference;
}
function shouldChooseEntryCard(attitudeToAgnes, agnesHasHandcard) {
  return agnesHasHandcard && attitudeToAgnes > 0;
}
function shouldUseKuAsShanAi(ku, ordinaryShanCount) {
  return canUseKuAsShan(ku) && ordinaryShanCount <= 0;
}
function getEntryControls(agnesHandcardCount) {
  return agnesHandcardCount > 0 ? ["获得一张手牌", "摸一张牌"] : ["摸一张牌"];
}
function grantsRepeatedResearchDraw(previousResearch) {
  return previousResearch > 0;
}
function canUseKuAsShan(ku) {
  return ku > 0;
}
function canUseLimitedRecovery(ku, hp, maxHp, hasUsed = false) {
  return !hasUsed && ku >= 2 && hp < maxHp;
}
function getRecoveryControls(ku) {
  return Array.from({ length: Math.max(0, ku) }, (_, index) => `${index + 1}枚`);
}
function getActualRemovedKu(chosen, currentKu) {
  return Math.max(0, Math.min(Math.trunc(chosen), Math.trunc(currentKu)));
}
function shouldTriggerKeshu(isOtherPlayer, cardType, research) {
  return isOtherPlayer && (cardType === "trick" || cardType === "delay") && research >= 2;
}
function getKeshuDrawCount(hasUsedLimitedRecovery) {
  return hasUsedLimitedRecovery ? 2 : 1;
}
export {
  canUseKuAsShan,
  canUseLimitedRecovery,
  getActualRemovedKu,
  getEntryControls,
  getEntryTargetAiScore,
  getKeshuDrawCount,
  getRecoveryControls,
  grantsRepeatedResearchDraw,
  isEntryTarget,
  shouldChooseEntryCard,
  shouldTriggerKeshu,
  shouldUseKuAsShanAi
};
//# sourceMappingURL=rules.js.map
