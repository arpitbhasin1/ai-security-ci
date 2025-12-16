"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
function log(level, current, msg) {
    if (current === "quiet")
        return;
    if (current === "normal" && level === "verbose")
        return;
    console.log(msg);
}
