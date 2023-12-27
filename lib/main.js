import { Connection, PublicKey, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, TransactionInstruction, TransactionMessage, } from "@solana/web3.js";
import * as core from "@actions/core";
import * as multisig from "@sqds/multisig";
import { BN } from "@marinade.finance/marinade-ts-sdk";
import { keypairFrom } from "./utils.js";
async function initialize() {
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
    console.log("Initializing...");
    let multisigVaultIndexNumber = Number(multisigVaultIndex);
    const multisigVault = multisig.getVaultPda({
        multisigPda: new PublicKey(multisigPda),
        index: multisigVaultIndexNumber,
    });
    const upgradeData = new BN(3, 10);
    const keys = [
        {
            pubkey: new PublicKey(executableData),
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: new PublicKey(programId),
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: new PublicKey(buffer),
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: new PublicKey(spillAddress),
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: SYSVAR_RENT_PUBKEY,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: SYSVAR_CLOCK_PUBKEY,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: new PublicKey(multisigVault),
            isWritable: false,
            isSigner: true,
        },
    ];
    const connection = new Connection(networkUrl, "confirmed");
    const blockhash = (await connection.getLatestBlockhash()).blockhash;
    const coreKeypair = keypairFrom(keypair, "keypair");
    const multisigInfo = await multisig.accounts.accountProviders.Multisig.fromAccountAddress(connection, new PublicKey(multisigPda));
    const transactionMessage = new TransactionMessage({
        payerKey: new PublicKey(multisigVault),
        recentBlockhash: blockhash,
        instructions: [
            new TransactionInstruction({
                programId: new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111"),
                data: upgradeData.toArrayLike(Buffer, "le", 4),
                keys,
            }),
        ],
    });
    const transactionSignature = await multisig.rpc.vaultTransactionCreate({
        multisigPda: new PublicKey(multisigPda),
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
initialize();
