import { game } from "noname";
import { translates as translates$4, characters as characters$4 } from "./src/characters/agnes/index.js";
import { translates as translates$3, characters as characters$3 } from "./src/characters/la-maupin/index.js";
import { translates as translates$2, characters as characters$2 } from "./src/characters/xiong-mumu/index.js";
import { translates as translates$1, characters as characters$1 } from "./src/characters/xinxiang/index.js";
import { translates, characters } from "./src/characters/barbin/index.js";
import characterIntros from "./src/intros.js";
import { setupBatchArenaReady, setupBatchPrecontent, setupBatchContent } from "./src/batch-mode.js";
import skills from "./src/characters/barbin/skills.js";
import skills$1 from "./src/characters/xinxiang/skills.js";
import skills$2 from "./src/characters/xiong-mumu/skills.js";
import skills$3 from "./src/characters/la-maupin/skills.js";
import skills$4 from "./src/characters/agnes/skills.js";
const type = "extension";
function index() {
  return {
    name: "Q-series",
    editable: false,
    connect: false,
    content: function(config, pack) {
      setupBatchContent();
    },
    precontent: function() {
      setupBatchPrecontent();
      game.addGroup("q", "酷", "酷势力", {
        color: [
          [244, 112, 173, 1],
          [166, 111, 230, 1],
          [92, 175, 255, 1],
          [255, 209, 102, 1]
        ]
      });
    },
    arenaReady: function() {
      setupBatchArenaReady();
    },
    config: {},
    help: {},
    package: {
      character: {
        character: { ...characters$4, ...characters$3, ...characters$2, ...characters$1, ...characters },
        characterIntro: { ...characterIntros },
        skill: { ...skills$4, ...skills$3, ...skills$2, ...skills$1, ...skills },
        translate: { ...translates$4, ...translates$3, ...translates$2, ...translates$1, ...translates }
      },
      card: {
        card: {},
        translate: {},
        list: []
      },
      skill: {
        skill: {},
        translate: {}
      },
      intro: "Q-series 原创与历史人物武将扩展",
      author: "Q-series",
      diskURL: "",
      forumURL: "",
      version: "0.1.0"
    },
    files: { character: ["image/agnes.png", "image/la-maupin.png", "image/xiong-mumu.png", "image/xinxiang.png", "image/barbin.png"], card: [], skill: [], audio: [] }
  };
}
export {
  index as default,
  type
};
//# sourceMappingURL=extension.js.map
