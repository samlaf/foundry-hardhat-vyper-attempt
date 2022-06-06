Structure of this project comes from https://github.com/foundry-rs/hardhat-foundry-template

But I can't get the `src/VyperImporter.vy` to work... it just won't generate the artifacts for `lib/pandora_protocol/contracts/vyper.ReceiptToken.vy`. Getting

```
Generating typings for: 17 artifacts in dir: typechain for target: ethers-v5
Successfully generated 29 typings!
Compiled 18 Solidity files successfully
HardhatError: HH700: Artifact for contract "ReceiptToken" not found. 
    at Artifacts._handleWrongArtifactForContractName (/Users/deckysetiawan/devel/abag/pandora-liq-bot/node_modules/hardhat/src/internal/artifacts.ts:478:11)
    at Artifacts._getArtifactPathFromFiles (/Users/deckysetiawan/devel/abag/pandora-liq-bot/node_modules/hardhat/src/internal/artifacts.ts:593:19)
    at Artifacts._getArtifactPath (/Users/deckysetiawan/devel/abag/pandora-liq-bot/node_modules/hardhat/src/internal/artifacts.ts:275:17)
    at async Artifacts.readArtifact (/Users/deckysetiawan/devel/abag/pandora-liq-bot/node_modules/hardhat/src/internal/artifacts.ts:58:26)
    at async getContractFactory (/Users/deckysetiawan/devel/abag/pandora-liq-bot/node_modules/@nomiclabs/hardhat-ethers/src/internal/helpers.ts:91:22)
    at async deploy_basic_contracts (/Users/deckysetiawan/devel/abag/pandora-liq-bot/lib/pandora_protocol/test/utils/basic_contracts.js:17:26)
    at async deployNeccessaryPandoraContracts (/Users/deckysetiawan/devel/abag/pandora-liq-bot/scripts/deploy_test_setup.ts:37:7)
    at async deploy (/Users/deckysetiawan/devel/abag/pandora-liq-bot/scripts/deploy_test_setup.ts:121:7)
```

Not sure if we need to change the preprocess function in `hardhat.config.ts` or what... I give up.
