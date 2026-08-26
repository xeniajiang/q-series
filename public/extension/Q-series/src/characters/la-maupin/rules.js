function getLaMaupinAttackRange(currentRange, hasEquippedCixiong) {
  return hasEquippedCixiong ? 5 : Math.max(2, currentRange);
}
function shouldGainKuFromSword(isJuewuSha, isKuangmingAwakened, hasGainedKuThisTurn) {
  return !isJuewuSha && (!isKuangmingAwakened || !hasGainedKuThisTurn);
}
function getCurrentJuewuTargets(record, phaseNumber) {
  return record?.phaseNumber === phaseNumber ? record.targets : [];
}
function shouldIgnoreShaCount(targets, usedTargets) {
  return targets.length > 0 && targets.every((target) => !usedTargets.includes(target));
}
function recordJuewuTargets(phaseNumber, usedTargets, targets) {
  return {
    phaseNumber,
    targets: [.../* @__PURE__ */ new Set([...usedTargets, ...targets])]
  };
}
export {
  getCurrentJuewuTargets,
  getLaMaupinAttackRange,
  recordJuewuTargets,
  shouldGainKuFromSword,
  shouldIgnoreShaCount
};
//# sourceMappingURL=rules.js.map
