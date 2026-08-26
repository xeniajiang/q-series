const MAX_YUAN = 3;
function getShanyuanAiScore(yuan, attitude) {
  const count = normalizedMarkCount(yuan);
  if (attitude > 0) return [8, 6, 4, 2][Math.min(count, 3)];
  return count === 0 ? 5 : -10;
}
function getLiyeRecipientAiValue(yuan, attitude) {
  const draw = getLiyeDrawCount(yuan);
  return attitude > 0 ? draw * (1 + Math.min(5, attitude) / 10) : -draw;
}
function getLiyeAiValue(relatedPlayerCount, bestRecipientValue) {
  return getLiyeSelfDrawCount(relatedPlayerCount) + bestRecipientValue;
}
function normalizedMarkCount(value) {
  return Math.max(0, Math.trunc(value));
}
function getShanyuanOutcome(color, currentYuan = 0) {
  const gainYuan = normalizedMarkCount(currentYuan) < MAX_YUAN;
  return color === "red" ? { recipient: "target", gainYuan } : { recipient: "self", gainYuan };
}
function getLiyeSelfDrawCount(relatedPlayerCount) {
  return normalizedMarkCount(relatedPlayerCount);
}
function getLiyeDrawCount(yuan) {
  return Math.min(MAX_YUAN, normalizedMarkCount(yuan));
}
function getLiyeDiscardCount(handcardCount) {
  return Math.min(2, normalizedMarkCount(handcardCount));
}
function getYihuanDrawCount(yuan) {
  return normalizedMarkCount(yuan);
}
function getYihuanPrepDrawCount(ku) {
  return normalizedMarkCount(ku) > 0 ? 1 : 0;
}
function getYihuanRescueKuCost(ku) {
  return normalizedMarkCount(ku);
}
function isAnfaJudgment(suit, number) {
  return suit === "club" && number >= 2 && number <= 9;
}
function shouldRunAnfaCheck(change, hasOccurred, sex = "female") {
  return !hasOccurred && sex === "female";
}
function canUseKuRescue(ku, hp) {
  return normalizedMarkCount(ku) > 0 && hp < 1;
}
function getKuRescueRecovery(hp) {
  return Math.max(0, 1 - Math.trunc(hp));
}
export {
  MAX_YUAN,
  canUseKuRescue,
  getKuRescueRecovery,
  getLiyeAiValue,
  getLiyeDiscardCount,
  getLiyeDrawCount,
  getLiyeRecipientAiValue,
  getLiyeSelfDrawCount,
  getShanyuanAiScore,
  getShanyuanOutcome,
  getYihuanDrawCount,
  getYihuanPrepDrawCount,
  getYihuanRescueKuCost,
  isAnfaJudgment,
  shouldRunAnfaCheck
};
//# sourceMappingURL=rules.js.map
