import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StakingProgram } from "../target/types/staking_program";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

describe("staking-program", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const mintKeyPair = Keypair.fromSecretKey(
    new Uint8Array([
      198, 118, 48, 215, 10, 21, 230, 18, 8, 155, 23, 25, 3, 102, 164, 231, 236,
      179, 41, 81, 193, 239, 131, 202, 239, 178, 89, 95, 238, 253, 68, 33, 11,
      60, 43, 44, 112, 167, 106, 239, 15, 23, 7, 125, 120, 248, 171, 226, 62,
      98, 93, 125, 106, 49, 205, 17, 61, 147, 35, 239, 253, 122, 173, 234,
    ])
  );
  // console.log(mintKeyPair);

  const program = anchor.workspace.StakingProgram as Program<StakingProgram>;

  async function createMintToken() {
    const mint = await createMint(
      connection,
      payer.payer,
      payer.publicKey,
      payer.publicKey,
      9,
      mintKeyPair
    );
    console.log(mint);
  }

  it("Is initialized!", async () => {
    // create mint token
    // await createMintToken();
    
    // create vault
    let [vaultAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    )
    const tx = await program.methods.initialize()
      .accounts({
        signer: payer.publicKey,
        tokenVaultAccount: vaultAccount,
        mint: mintKeyPair.publicKey
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("Stake", async () => {
    let userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer.payer,
      mintKeyPair.publicKey,
      payer.publicKey
    )

    await mintTo(
      connection,
      payer.payer,
      mintKeyPair.publicKey,
      userTokenAccount.address,
      payer.payer,
      1e11
    )

    let [stakeInfo] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_info"), payer.publicKey.toBuffer()],
      program.programId
    )

    let [stakeAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("token"), payer.publicKey.toBuffer()],
      program.programId
    )

    await getOrCreateAssociatedTokenAccount(
      connection,
      payer.payer,
      mintKeyPair.publicKey,
      payer.publicKey
    )

    const tx = await program.methods
      .stake(new anchor.BN(1))
      .signers([payer.payer])
      .accounts({
        stakeInfoAccount: stakeInfo,
        stakeAccount: stakeAccount,
        userTokenAccount: userTokenAccount.address,
        mint: mintKeyPair.publicKey
      })
      .rpc();

    console.log("Your transaction signature", tx);
  });

  it("Unstake", async () => {
    let userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer.payer,
      mintKeyPair.publicKey,
      payer.publicKey
    )

    let [vaultAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    )

    let [stakeInfo] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_info"), payer.publicKey.toBuffer()],
      program.programId
    )

    let [stakeAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("token"), payer.publicKey.toBuffer()],
      program.programId
    )

    await mintTo(
      connection,
      payer.payer,
      mintKeyPair.publicKey,
      vaultAccount,
      payer.payer,
      1e21
    )

    const tx = await program.methods
      .unstake()
      .signers([payer.payer])
      .accounts({
        stakeAccount: stakeAccount,
        stakeInfoAccount: stakeInfo,
        userTokenAccount: userTokenAccount.address,
        tokenVaultAccount: vaultAccount,
        signer: payer.publicKey,
        mint: mintKeyPair.publicKey,
      })
      .rpc();

    console.log("Your transaction signature", tx);
  })
});
