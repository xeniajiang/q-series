import { getDefaultExportFromCjs } from "./_commonjsHelpers.js";
import { __require as requireErrorStackParser } from "../vendor/pnpm/error-stack-parser@2.1.4/modules/error-stack-parser/error-stack-parser.js";
var errorStackParserExports = requireErrorStackParser();
const ErrorStackParser = /* @__PURE__ */ getDefaultExportFromCjs(errorStackParserExports);
export {
  ErrorStackParser as default
};
