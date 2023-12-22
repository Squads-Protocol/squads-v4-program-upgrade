"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keypairFrom = void 0;
const anchor_1 = require("@coral-xyz/anchor");
const web3_js_1 = require("@solana/web3.js");
const keypairFrom = (s, n) => {
    try {
        if (s.includes("[")) {
            return web3_js_1.Keypair.fromSecretKey(Buffer.from(s
                .replace("[", "")
                .replace("]", "")
                .split(",")
                .map((c) => parseInt(c))));
        }
        else {
            return web3_js_1.Keypair.fromSecretKey(anchor_1.utils.bytes.bs58.decode(s));
        }
    }
    catch (e) {
        try {
            return web3_js_1.Keypair.fromSecretKey(Buffer.from(JSON.parse(require("fs").readFileSync(s, {
                encoding: "utf-8",
            }))));
        }
        catch (e2) {
            process.stdout.write(`${n !== null && n !== void 0 ? n : "keypair"} is not valid keypair`);
            process.exit(1);
        }
    }
};
exports.keypairFrom = keypairFrom;
//# sourceMappingURL=utils.js.map