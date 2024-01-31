import { utils } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";

export const keypairFrom = (s: string, n?: string): Keypair => {
  try {
    if (s.includes("[")) {
      return Keypair.fromSecretKey(
        Buffer.from(
          s
            .replace("[", "")
            .replace("]", "")
            .split(",")
            .map((c) => parseInt(c))
        )
      );
    } else {
      return Keypair.fromSecretKey(utils.bytes.bs58.decode(s));
    }
  } catch (e) {
    try {
      return Keypair.fromSecretKey(
        Buffer.from(
          JSON.parse(
            require("fs").readFileSync(s, {
              encoding: "utf-8",
            })
          )
        )
      );
    } catch (e2) {
      process.stdout.write(`${n ?? "keypair"} is not valid keypair`);
      process.exit(1);
    }
  }
};

export const getIDLPDA = async (programId: PublicKey) => {
  const [base] = PublicKey.findProgramAddressSync([], programId);
  return PublicKey.createWithSeed(base, "anchor:idl", programId);
};

const IDL_UPGRADE_INSTRUCTION_DISCRIMINATOR = "40f4bc78a7e9690a03";

export const IDL_DISCRIMINATOR = utils.bytes.hex.decode(
  `${IDL_UPGRADE_INSTRUCTION_DISCRIMINATOR}`
);
