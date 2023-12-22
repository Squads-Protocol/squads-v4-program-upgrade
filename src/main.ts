import * as core from "@actions/core";
import {
  AccountMeta,
  Connection,
  Keypair,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  TransactionMessage,
} from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import { keypairFrom } from "./utils";
import { BN } from "@coral-xyz/anchor";

async function run(): Promise<void> {
  try {
    const networkUrl: string = core.getInput("network-url");
    const multisigPda: string = core.getInput("multisig-pda");
    const multisigVaultIndex: string = core.getInput("multisig-vault-index");
    const programId: string = core.getInput("program-id");
    const buffer: string = core.getInput("buffer");
    const spillAddress: string = core.getInput("spill-address");
    const name: string = core.getInput("name");
    const keypair: string = core.getInput("keypair");
    const executableData: string = core.getInput("executable-data");
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
      multisigPda: new PublicKey(multisigPda),
      index: multisigVaultIndexNumber,
    });

    const upgradeData = new BN(3, 10);
    const keys: AccountMeta[] = [
      {
        pubkey: new PublicKey(executableData), // executable data
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: new PublicKey(programId), // program id
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: new PublicKey(buffer), // buffer address
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: new PublicKey(spillAddress), // address that claims rent (mostly old program authority)
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
        pubkey: new PublicKey(multisigVault), // squad vault
        isWritable: false,
        isSigner: true,
      },
    ];

    const connection = new Connection(networkUrl, "confirmed");

    const blockhash = (await connection.getLatestBlockhash()).blockhash;

    const coreKeypair = keypairFrom(keypair, "keypair");

    const multisigInfo = await multisig.accounts.Multisig.fromAccountAddress(
      connection,
      new PublicKey(multisigPda)
    );

    const transactionMessage = new TransactionMessage({
      payerKey: new PublicKey(multisigVault),
      recentBlockhash: blockhash,
      instructions: [
        new TransactionInstruction({
          programId: new PublicKey(
            "BPFLoaderUpgradeab1e11111111111111111111111"
          ),
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
  } catch (error) {
    console.log(error);
    core.debug(`error: ${error}`);
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
