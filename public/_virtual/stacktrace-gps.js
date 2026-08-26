import { getDefaultExportFromCjs } from "./_commonjsHelpers.js";
import { __require as requireStacktraceGps } from "../vendor/pnpm/stacktrace-gps@3.1.2/modules/stacktrace-gps/stacktrace-gps.js";
var stacktraceGpsExports = requireStacktraceGps();
const StackTraceGPS = /* @__PURE__ */ getDefaultExportFromCjs(stacktraceGpsExports);
export {
  StackTraceGPS as default
};
