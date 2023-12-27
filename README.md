## Squads v4 program upgrades GitHub action

This action makes it possible to initialize a Solana program deployment via your CICD pipeline.

Example usage:

```yml
steps:
  - uses: actions/checkout@v4
  - uses: ./
    with:
      network-url: "https://api.mainnet-beta.solana.com"
      multisig-pda: "Aumm6P4VT4RcZUspSBRRkTYt2RFCWVfUhci23LrFNfZC"
      multisig-vault-index: "1"
      program-id: "89xd9GGQ6gd9qcxciu5TAcH1WSbwVuMTgDseh7Vge5tp"
      buffer: "Hs93mJ3HC9qJz6ttpGGk12piv1bVxndv1RE86t585Duj"
      spill-address: "FU2pN8qudMjtBCnU6QAavsvhZFTgXrdJ8JkLRArRuZ4n"
      name: "Test Upgrade"
      executable-data: "ELWwLnkMhEBsMuBUjDqHuN8sdy3AxxDAHU6MhVX5tG2U"
      keypair: ${{ secrets.DEPLOYER_KEYPAIR }}
```

The format of the Keypair needs to be a Uint8Array or a Private key.
