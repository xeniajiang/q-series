import refreshSkills from "/src/character/refresh/skill.js";
import refreshTranslate from "/src/character/refresh/translate.js";
import spSkills from "./sp/skill.js";
import spTranslate from "./sp/translate.js";
import twSkills from "./tw/skill.js";
import twTranslate from "./tw/translate.js";

export const type = "character";

export default () => ({
	name: "q_dependencies",
	connect: true,
	character: {},
	skill: { ...refreshSkills, ...spSkills, ...twSkills },
	translate: { ...refreshTranslate, ...spTranslate, ...twTranslate },
});
