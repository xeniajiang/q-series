const BARBIN_TARGET_EVENT = "useCardToTargeted";
const BARBIN_SKILL_TARGET_EVENTS = ["useSkill", "logSkillBegin"];
function isDesignationSkillTarget(isOtherPlayer, isListedTarget, isViewAsSkill, hasSkillName) {
  return isOtherPlayer && isListedTarget && !isViewAsSkill && hasSkillName;
}
const IMMEDIATE_EFFECT_THRESHOLD = 0.5;
function getRoundUseCount(record, roundNumber) {
  return record?.roundNumber === roundNumber ? record.count : 0;
}
function canUseWithinRound(record, roundNumber, limit) {
  return getRoundUseCount(record, roundNumber) < limit;
}
function recordRoundUse(record, roundNumber) {
  return {
    roundNumber,
    count: getRoundUseCount(record, roundNumber) + 1
  };
}
function getInterventionOutcome(maleMarks, femaleMarks, tieSex) {
  const male = Math.max(0, Math.trunc(maleMarks));
  const female = Math.max(0, Math.trunc(femaleMarks));
  return {
    sex: male === female ? tieSex : male > female ? "male" : "female",
    kuGained: Math.min(male, female) * 2
  };
}
function getCriticalDesignationKu(maleMarks, femaleMarks, declaredSex) {
  const male = Math.max(0, Math.trunc(maleMarks));
  const female = Math.max(0, Math.trunc(femaleMarks));
  if (male + female !== 2) return void 0;
  const nextMale = male + (declaredSex === "male" ? 1 : 0);
  const nextFemale = female + (declaredSex === "female" ? 1 : 0);
  return Math.min(nextMale, nextFemale) * 2;
}
function canGainDesignationMark(maleMarks, femaleMarks) {
  return Math.max(0, Math.trunc(maleMarks)) + Math.max(0, Math.trunc(femaleMarks)) < 3;
}
function getYushenDrawCount(sex, kuAfterRemoval) {
  if (sex !== "unknown") return 0;
  return Math.trunc(kuAfterRemoval) > 0 ? 1 : 0;
}
function chooseDesignationDeclaration(input) {
  const immediateDifference = input.maleImmediateEffect - input.femaleImmediateEffect;
  if (Math.abs(immediateDifference) > IMMEDIATE_EFFECT_THRESHOLD) {
    if (input.isFriendly) return immediateDifference > 0 ? "male" : "female";
    return immediateDifference > 0 ? "female" : "male";
  }
  if (input.maleMarks === input.femaleMarks) return input.tieSex;
  if (input.isFriendly) return input.maleMarks < input.femaleMarks ? "male" : "female";
  return input.maleMarks < input.femaleMarks ? "female" : "male";
}
function shouldRejectDesignation(input) {
  if (!input.hasNonCriticalDiscard) return false;
  if (input.immediateEffectDifference < -IMMEDIATE_EFFECT_THRESHOLD) return true;
  if (input.immediateEffectDifference > IMMEDIATE_EFFECT_THRESHOLD) return false;
  const total = input.maleMarks + input.femaleMarks;
  if (input.ku >= 3) return total === 2;
  const lowestValue = input.lowestNonCriticalDiscardValue ?? 0;
  if (input.ku === 2) {
    const milestoneBenefit = Math.max(0, input.rejectionMilestoneBenefit ?? 0);
    const threshold = 4 + milestoneBenefit + (total === 2 ? 1 : 0);
    return lowestValue <= threshold;
  }
  const ordinaryDiscardAllowed = input.handcardsAfterDiscard >= input.hp;
  const nextMale = input.maleMarks + (input.declaredSex === "male" ? 1 : 0);
  const nextFemale = input.femaleMarks + (input.declaredSex === "female" ? 1 : 0);
  if (total === 2) {
    return ordinaryDiscardAllowed && lowestValue <= 4 && (nextMale === 3 || nextFemale === 3);
  }
  if (input.maleMarks === input.femaleMarks) return false;
  const declaredCurrentMajority = input.maleMarks > input.femaleMarks && input.declaredSex === "male" || input.femaleMarks > input.maleMarks && input.declaredSex === "female";
  return ordinaryDiscardAllowed && lowestValue <= 4 && declaredCurrentMajority;
}
function getDesignationRejectionOutcome(confirmed, discardedCardCount) {
  const rejected = confirmed && discardedCardCount > 0;
  return { rejected, kuGained: rejected ? 1 : 0 };
}
function shouldTriggerRejectionMilestone(kuBefore, kuGained, hasTriggered) {
  if (hasTriggered) return false;
  const before = Math.max(0, Math.trunc(kuBefore));
  const gained = Math.max(0, Math.trunc(kuGained));
  return gained > 0 && before < 3 && before + gained >= 3;
}
function shouldCancelWithYushen(confirmed, ku) {
  return confirmed && ku > 0;
}
export {
  BARBIN_SKILL_TARGET_EVENTS,
  BARBIN_TARGET_EVENT,
  canGainDesignationMark,
  canUseWithinRound,
  chooseDesignationDeclaration,
  getCriticalDesignationKu,
  getDesignationRejectionOutcome,
  getInterventionOutcome,
  getRoundUseCount,
  getYushenDrawCount,
  isDesignationSkillTarget,
  recordRoundUse,
  shouldCancelWithYushen,
  shouldRejectDesignation,
  shouldTriggerRejectionMilestone
};
//# sourceMappingURL=rules.js.map
