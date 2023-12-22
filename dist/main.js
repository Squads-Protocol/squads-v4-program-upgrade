"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const web3_js_1 = require("@solana/web3.js");
const multisig = __importStar(require("@sqds/multisig"));
const utils_1 = require("./utils");
const anchor_1 = require("@coral-xyz/anchor");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const networkUrl = core.getInput("network-url");
            const multisigPda = core.getInput("multisig-pda");
            const multisigVaultIndex = core.getInput("multisig-vault-index");
            const programId = core.getInput("program-id");
            const buffer = core.getInput("buffer");
            const spillAddress = core.getInput("spill-address");
            const name = core.getInput("name");
            const keypair = core.getInput("keypair");
            const executableData = core.getInput("executable-data");
            core.debug(`start: ${new Date().toLocaleString()}`);
            core.debug(`networkUrl: ${networkUrl}`);
            core.debug(`multisigVaultIndex: ${multisigVaultIndex}`);
            core.debug(`programId: ${programId}`);
            core.debug(`buffer: ${buffer}`);
            core.debug(`spillAddress: ${spillAddress}`);
            core.debug(`name: ${name}`);
            core.debug(`keypair: **********`);
            let multisigVaultIndexNumber = Number(multisigVaultIndex);
            const multisigVault = multisig.getVaultPda({
                multisigPda: new web3_js_1.PublicKey(multisigPda),
                index: multisigVaultIndexNumber,
            });
            const upgradeData = new anchor_1.BN(3, 10);
            const keys = [
                {
                    pubkey: new web3_js_1.PublicKey(executableData), // executable data
                    isWritable: true,
                    isSigner: false,
                },
                {
                    pubkey: new web3_js_1.PublicKey(programId), // program id
                    isWritable: true,
                    isSigner: false,
                },
                {
                    pubkey: new web3_js_1.PublicKey(buffer), // buffer address
                    isWritable: true,
                    isSigner: false,
                },
                {
                    pubkey: new web3_js_1.PublicKey(spillAddress), // address that claims rent (mostly old program authority)
                    isWritable: true,
                    isSigner: false,
                },
                {
                    pubkey: web3_js_1.SYSVAR_RENT_PUBKEY,
                    isWritable: false,
                    isSigner: false,
                },
                {
                    pubkey: web3_js_1.SYSVAR_CLOCK_PUBKEY,
                    isWritable: false,
                    isSigner: false,
                },
                {
                    pubkey: new web3_js_1.PublicKey(multisigVault), // squad vault
                    isWritable: false,
                    isSigner: true,
                },
            ];
            const connection = new web3_js_1.Connection(networkUrl, "confirmed");
            const blockhash = (yield connection.getLatestBlockhash()).blockhash;
            const coreKeypair = (0, utils_1.keypairFrom)(keypair, "keypair");
            const multisigInfo = yield multisig.accounts.Multisig.fromAccountAddress(connection, new web3_js_1.PublicKey(multisigPda));
            const transactionMessage = new web3_js_1.TransactionMessage({
                payerKey: new web3_js_1.PublicKey(multisigVault),
                recentBlockhash: blockhash,
                instructions: [
                    new web3_js_1.TransactionInstruction({
                        programId: new web3_js_1.PublicKey("BPFLoaderUpgradeab1e11111111111111111111111"),
                        data: upgradeData.toArrayLike(Buffer, "le", 4),
                        keys,
                    }),
                ],
            });
            const transactionSignature = yield multisig.rpc.vaultTransactionCreate({
                multisigPda: new web3_js_1.PublicKey(multisigPda),
                creator: coreKeypair.publicKey,
                feePayer: coreKeypair,
                connection,
                ephemeralSigners: 0,
                transactionIndex: BigInt(Number(multisigInfo.transactionIndex)),
                transactionMessage,
                vaultIndex: multisigVaultIndexNumber,
                addressLookupTableAccounts: undefined,
                memo: name,
            });
            core.info(`transactionSignature: ${transactionSignature}`);
            core.info("Proposal has been created, execute it on the Squads app.");
        }
        catch (error) {
            console.log(error);
            core.debug(`error: ${error}`);
            if (error instanceof Error)
                core.setFailed(error.message);
        }
    });
}
run();
//# sourceMappingURL=main.js.map