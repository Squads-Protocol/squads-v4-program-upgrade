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
import { BN } from "@marinade.finance/marinade-ts-sdk";
import { keypairFrom } from "./utils.js";

async function initialize() {
  const networkUrl: string = process.env.NETWORK_URL!;
  const multisigPda: string = process.env.MULTISIG_PDA!;
  const multisigVaultIndex = process.env.MULTISIG_VAULT_INDEX!;
  const programId = process.env.PROGRAM_ID!;
  const buffer = process.env.BUFFER!;
  const spillAddress = process.env.SPILL_ADDRESS!;
  const name = process.env.NAME!;
  const keypair = process.env.KEYPAIR!;
  const executableData = process.env.EXECUTABLE_DATA!;

  console.log(`Network URL: ${networkUrl}`);
  console.log(`Multisig PDA: ${multisigPda}`);
  console.log(`Multisig Vault Index: ${multisigVaultIndex}`);
  console.log(`Program ID: ${programId}`);
  console.log(`Buffer: ${buffer}`);
  console.log(`Spill Address: ${spillAddress}`);
  console.log(`Name: ${name}`);
  console.log(`Executable Data: ${executableData}`);
  console.log(`Keypair: ***`);
  console.log("Initializing...");

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

  const multisigInfo =
    await multisig.accounts.accountProviders.Multisig.fromAccountAddress(
      connection,
      new PublicKey(multisigPda)
    );

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
    transactionIndex: BigInt(Number(multisigInfo.transactionIndex) + 1),
    transactionMessage,
    vaultIndex: multisigVaultIndexNumber,
    addressLookupTableAccounts: undefined,
    memo: name,
  });

  core.info(`transactionSignature: ${transactionSignature}`);
  core.info("Proposal has been created, execute it on the Squads app.");
}

initialize();
