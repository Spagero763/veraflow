// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SoulboundCredential} from "../src/core/SoulboundCredential.sol";
import {CredentialRegistry} from "../src/core/CredentialRegistry.sol";
import {CredentialVerifier} from "../src/core/CredentialVerifier.sol";
import {WorkerIdentity} from "../src/identity/WorkerIdentity.sol";
import {ReputationScore} from "../src/identity/ReputationScore.sol";
import {LendingPool} from "../src/lending/LendingPool.sol";
import {LoanManager} from "../src/lending/LoanManager.sol";
import {CollateralOracle} from "../src/lending/CollateralOracle.sol";
import {IssuerGovernance} from "../src/governance/IssuerGovernance.sol";
import {DisputeResolver} from "../src/governance/DisputeResolver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Deploy
/// @author Afolabi Emmanuel
/// @notice Full deployment script for the VeraFlow protocol
/// @dev Deploys all contracts in dependency order and wires them together.
///
///      Usage:
///        Fuji testnet:
///          forge script script/Deploy.s.sol --rpc-url avalanche_fuji \
///            --broadcast --verify -vvvv
///
///        Local anvil:
///          forge script script/Deploy.s.sol --rpc-url http://localhost:8545 \
///            --broadcast -vvvv
///
///      Required env vars:
///        DEPLOYER_PRIVATE_KEY  — deployer wallet private key
///        USDC_ADDRESS          — stablecoin address on target network
///        TREASURY_ADDRESS      — protocol treasury address
///        COUNCIL_1             — first governance council member
///        COUNCIL_2             — second governance council member
///        COUNCIL_3             — third governance council member
contract Deploy is Script {
    // =========================================================================
    // DEPLOYED ADDRESSES — populated during run()
    // =========================================================================

    SoulboundCredential public credentialNFT;
    CredentialRegistry public registry;
    CredentialVerifier public verifier;
    WorkerIdentity public workerIdentity;
    ReputationScore public reputationScore;
    LendingPool public lendingPool;
    LoanManager public loanManager;
    CollateralOracle public collateralOracle;
    IssuerGovernance public governance;
    DisputeResolver public disputeResolver;

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    /// @dev Governance quorum: 2 of 3 council members required
    uint32 constant GOVERNANCE_QUORUM = 2;

    /// @dev Voting window: 7 days
    uint256 constant VOTING_WINDOW = 7 days;

    /// @dev Dispute stake: 0.1 AVAX
    uint256 constant DISPUTE_STAKE = 0.1 ether;

    /// @dev Dispute voting window: 7 days
    uint256 constant DISPUTE_VOTING_WINDOW = 7 days;

    /// @dev Dispute quorum: 2 of 3
    uint32 constant DISPUTE_QUORUM = 2;

    // =========================================================================
    // MAIN ENTRY POINT
    // =========================================================================

    function run() external {
        // Load deployer from env
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        // Load config from env
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");

        address council1 = vm.envAddress("COUNCIL_1");
        address council2 = vm.envAddress("COUNCIL_2");
        address council3 = vm.envAddress("COUNCIL_3");

        address[] memory council = new address[](3);
        council[0] = council1;
        council[1] = council2;
        council[2] = council3;

        console2.log("=== VeraFlow Protocol Deployment ===");
        console2.log("Deployer:  ", deployer);
        console2.log("Chain ID:  ", block.chainid);
        console2.log("USDC:      ", usdcAddress);
        console2.log("Treasury:  ", treasury);

        vm.startBroadcast(deployerKey);

        _deployCore(deployer, usdcAddress);
        _deployGovernance(deployer, council, treasury);
        _wireContracts();
        _logAddresses();

        vm.stopBroadcast();

        console2.log("=== Deployment Complete ===");
    }

    // =========================================================================
    // DEPLOYMENT STEPS
    // =========================================================================

    function _deployCore(address deployer, address usdcAddress) internal {
        console2.log("\n--- Step 1: Core Contracts ---");

        // 1. SoulboundCredential
        credentialNFT = new SoulboundCredential(deployer);
        console2.log("SoulboundCredential:", address(credentialNFT));

        // 2. CredentialRegistry
        registry = new CredentialRegistry(deployer, address(credentialNFT));
        console2.log("CredentialRegistry: ", address(registry));

        // 3. CredentialVerifier (stateless — no owner needed)
        verifier = new CredentialVerifier(address(credentialNFT), address(registry));
        console2.log("CredentialVerifier: ", address(verifier));

        console2.log("\n--- Step 2: Identity Contracts ---");

        // 4. WorkerIdentity
        workerIdentity = new WorkerIdentity(deployer);
        console2.log("WorkerIdentity:     ", address(workerIdentity));

        // 5. ReputationScore
        reputationScore = new ReputationScore(
            deployer,
            address(workerIdentity),
            address(credentialNFT),
            address(registry)
        );
        console2.log("ReputationScore:    ", address(reputationScore));

        console2.log("\n--- Step 3: Lending Contracts ---");

        // 6. LendingPool
        lendingPool = new LendingPool(
            IERC20(usdcAddress),
            deployer,
            address(workerIdentity),
            address(reputationScore)
        );
        console2.log("LendingPool:        ", address(lendingPool));

        // 7. LoanManager
        loanManager = new LoanManager(
            deployer,
            address(lendingPool),
            address(reputationScore),
            address(workerIdentity)
        );
        console2.log("LoanManager:        ", address(loanManager));

        // 8. CollateralOracle
        collateralOracle = new CollateralOracle(
            deployer,
            address(workerIdentity),
            address(lendingPool),
            address(reputationScore)
        );
        console2.log("CollateralOracle:   ", address(collateralOracle));
    }

    function _deployGovernance(
        address deployer,
        address[] memory council,
        address treasury
    ) internal {
        console2.log("\n--- Step 4: Governance Contracts ---");

        // 9. IssuerGovernance
        governance = new IssuerGovernance(
            deployer,
            address(registry),
            council,
            GOVERNANCE_QUORUM,
            VOTING_WINDOW
        );
        console2.log("IssuerGovernance:   ", address(governance));

        // 10. DisputeResolver
        disputeResolver = new DisputeResolver(
            deployer,
            address(credentialNFT),
            address(workerIdentity),
            address(registry),
            treasury,
            DISPUTE_STAKE,
            DISPUTE_VOTING_WINDOW,
            DISPUTE_QUORUM
        );
        console2.log("DisputeResolver:    ", address(disputeResolver));
    }

    function _wireContracts() internal {
        console2.log("\n--- Step 5: Wiring Contracts ---");

        // SoulboundCredential → CredentialRegistry
        credentialNFT.setCredentialRegistry(address(registry));
        console2.log("credentialNFT.setCredentialRegistry done");

        // CredentialRegistry → WorkerIdentity
        registry.setWorkerIdentity(address(workerIdentity));
        console2.log("registry.setWorkerIdentity done");

        // WorkerIdentity → ReputationScore
        workerIdentity.setReputationScoreContract(address(reputationScore));
        console2.log("workerIdentity.setReputationScoreContract done");

        // WorkerIdentity → CredentialRegistry
        workerIdentity.setCredentialRegistryContract(address(registry));
        console2.log("workerIdentity.setCredentialRegistryContract done");

        // ReputationScore → LoanManager
        reputationScore.setLoanManager(address(loanManager));
        console2.log("reputationScore.setLoanManager done");

        // LendingPool → LoanManager
        lendingPool.setLoanManager(address(loanManager));
        console2.log("lendingPool.setLoanManager done");

        // Transfer registry ownership to governance DAO
        // NOTE: Comment this out for initial testnet deployment —
        //       keep deployer as owner for easier iteration during hackathon.
        // registry.transferOwnership(address(governance));
        // console2.log("registry ownership transferred to governance");

        console2.log("All contracts wired.");
    }

    function _logAddresses() internal view {
        console2.log("\n=== DEPLOYMENT SUMMARY ===");
        console2.log("Copy these into your .env and frontend config:\n");
        console2.log("CREDENTIAL_NFT=      ", address(credentialNFT));
        console2.log("CREDENTIAL_REGISTRY= ", address(registry));
        console2.log("CREDENTIAL_VERIFIER= ", address(verifier));
        console2.log("WORKER_IDENTITY=     ", address(workerIdentity));
        console2.log("REPUTATION_SCORE=    ", address(reputationScore));
        console2.log("LENDING_POOL=        ", address(lendingPool));
        console2.log("LOAN_MANAGER=        ", address(loanManager));
        console2.log("COLLATERAL_ORACLE=   ", address(collateralOracle));
        console2.log("ISSUER_GOVERNANCE=   ", address(governance));
        console2.log("DISPUTE_RESOLVER=    ", address(disputeResolver));
    }
}