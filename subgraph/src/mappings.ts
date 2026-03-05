import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import {
  InstitutionApplied,
  InstitutionApproved,
  InstitutionRevoked,
  InstitutionTrustLevelUpdated,
  CredentialIssued,
} from "../generated/CredentialRegistry/CredentialRegistry";

import { CredentialRevoked } from "../generated/SoulboundCredential/SoulboundCredential";

import {
  IdentityRegistered,
  StatusChanged,
  ReputationScoreUpdated,
  ProfileUpdated,
} from "../generated/WorkerIdentity/WorkerIdentity";

import {
  LoanOriginated,
  LoanFullyRepaid,
  LoanDefaulted,
} from "../generated/LendingPool/LendingPool";

import {
  ProposalCreated,
  VoteCast,
  ProposalExecuted,
} from "../generated/IssuerGovernance/IssuerGovernance";

import {
  DisputeRaised,
  DisputeUpheld,
  DisputeDismissed,
} from "../generated/DisputeResolver/DisputeResolver";

import {
  Institution,
  Worker,
  Credential,
  ScoreUpdate,
  Loan,
  Proposal,
  Vote,
  Dispute,
  ProtocolStats,
} from "../generated/schema";

// =========================================================================
// HELPERS
// =========================================================================

function getOrCreateStats(): ProtocolStats {
  let stats = ProtocolStats.load("global");
  if (stats == null) {
    stats = new ProtocolStats("global");
    stats.totalWorkers = BigInt.fromI32(0);
    stats.totalCredentials = BigInt.fromI32(0);
    stats.totalInstitutions = BigInt.fromI32(0);
    stats.totalLoansOriginated = BigInt.fromI32(0);
    stats.totalLoansRepaid = BigInt.fromI32(0);
    stats.totalLoansDefaulted = BigInt.fromI32(0);
    stats.totalVolumeOriginated = BigInt.fromI32(0);
    stats.totalVolumeRepaid = BigInt.fromI32(0);
    stats.updatedAt = BigInt.fromI32(0);
  }
  return stats;
}

function getOrCreateWorker(id: string): Worker {
  let worker = Worker.load(id);
  if (worker == null) {
    worker = new Worker(id);
    worker.didHash = Bytes.fromI32(0);
    worker.status = 0;
    worker.profileMetaHash = Bytes.fromI32(0);
    worker.reputationScore = 0;
    worker.credentialCount = 0;
    worker.registeredAt = BigInt.fromI32(0);
    worker.updatedAt = BigInt.fromI32(0);
  }
  return worker;
}

function getOrCreateInstitution(id: string): Institution {
  let institution = Institution.load(id);
  if (institution == null) {
    institution = new Institution(id);
    institution.name = "";
    institution.country = "";
    institution.trustLevel = 0;
    institution.active = false;
    institution.appliedAt = BigInt.fromI32(0);
    institution.totalIssued = BigInt.fromI32(0);
  }
  return institution;
}

// =========================================================================
// INSTITUTION HANDLERS
// =========================================================================

export function handleInstitutionApplied(event: InstitutionApplied): void {
  let id = event.params.wallet.toHexString();
  let institution = getOrCreateInstitution(id);
  institution.name = event.params.name;
  institution.country = event.params.country;
  institution.trustLevel = 1;
  institution.active = false;
  institution.appliedAt = event.params.appliedAt;
  institution.save();

  let stats = getOrCreateStats();
  stats.totalInstitutions = stats.totalInstitutions.plus(BigInt.fromI32(1));
  stats.updatedAt = event.block.timestamp;
  stats.save();
}

export function handleInstitutionApproved(event: InstitutionApproved): void {
  let id = event.params.wallet.toHexString();
  let institution = getOrCreateInstitution(id);
  institution.trustLevel = event.params.trustLevel;
  institution.active = true;
  institution.approvedAt = event.params.approvedAt;
  institution.save();
}

export function handleInstitutionRevoked(event: InstitutionRevoked): void {
  let id = event.params.wallet.toHexString();
  let institution = getOrCreateInstitution(id);
  institution.active = false;
  institution.revokedAt = event.block.timestamp;
  institution.save();
}

export function handleInstitutionTrustLevelUpdated(
  event: InstitutionTrustLevelUpdated
): void {
  let id = event.params.wallet.toHexString();
  let institution = getOrCreateInstitution(id);
  institution.trustLevel = event.params.newLevel;
  institution.save();
}

// =========================================================================
// CREDENTIAL HANDLERS
// =========================================================================

export function handleCredentialIssued(event: CredentialIssued): void {
  let tokenId = event.params.tokenId.toString();
  let credential = new Credential(tokenId);
  credential.tokenId = event.params.tokenId;
  credential.institution = event.params.institution.toHexString();
  credential.holder = event.params.holder.toHexString();
  credential.credentialType = event.params.credentialType;
  credential.burnAuth = 0;
  credential.issuedAt = event.block.timestamp;
  credential.expiresAt = BigInt.fromI32(0);
  credential.metadataHash = Bytes.fromI32(0);
  credential.revoked = false;
  credential.valid = true;
  credential.save();

  let workerId = event.params.holder.toHexString();
  let worker = getOrCreateWorker(workerId);
  worker.credentialCount = worker.credentialCount + 1;
  worker.updatedAt = event.block.timestamp;
  worker.save();

  let institutionId = event.params.institution.toHexString();
  let institution = getOrCreateInstitution(institutionId);
  institution.totalIssued = institution.totalIssued.plus(BigInt.fromI32(1));
  institution.save();

  let stats = getOrCreateStats();
  stats.totalCredentials = stats.totalCredentials.plus(BigInt.fromI32(1));
  stats.updatedAt = event.block.timestamp;
  stats.save();
}

export function handleCredentialRevoked(event: CredentialRevoked): void {
  let tokenId = event.params.tokenId.toString();
  let credential = Credential.load(tokenId);
  if (credential == null) {
    log.warning("Credential not found: {}", [tokenId]);
    return;
  }
  credential.revoked = true;
  credential.valid = false;
  credential.revokedAt = event.block.timestamp;
  credential.revokeReason = event.params.reason;
  credential.save();
}

// =========================================================================
// WORKER IDENTITY HANDLERS
// =========================================================================

export function handleIdentityRegistered(event: IdentityRegistered): void {
  let id = event.params.wallet.toHexString();
  let worker = getOrCreateWorker(id);
  worker.didHash = event.params.didHash;
  worker.status = 1;
  worker.registeredAt = event.params.registeredAt;
  worker.updatedAt = event.block.timestamp;
  worker.save();

  let stats = getOrCreateStats();
  stats.totalWorkers = stats.totalWorkers.plus(BigInt.fromI32(1));
  stats.updatedAt = event.block.timestamp;
  stats.save();
}

export function handleIdentityStatusChanged(event: StatusChanged): void {
  let id = event.params.wallet.toHexString();
  let worker = getOrCreateWorker(id);
  worker.status = event.params.newStatus;
  worker.updatedAt = event.block.timestamp;
  worker.save();
}

export function handleReputationScoreUpdated(
  event: ReputationScoreUpdated
): void {
  let id = event.params.wallet.toHexString();
  let worker = getOrCreateWorker(id);
  let oldScore = worker.reputationScore;
  worker.reputationScore = event.params.newScore.toI32();
  worker.updatedAt = event.block.timestamp;
  worker.save();

  let historyId =
    id + "-" + event.block.number.toString() + "-" + event.logIndex.toString();
  let scoreUpdate = new ScoreUpdate(historyId);
  scoreUpdate.worker = id;
  scoreUpdate.oldScore = oldScore;
  scoreUpdate.newScore = event.params.newScore.toI32();
  scoreUpdate.updatedAt = event.block.timestamp;
  scoreUpdate.txHash = event.transaction.hash;
  scoreUpdate.save();
}

export function handleProfileUpdated(event: ProfileUpdated): void {
  let id = event.params.wallet.toHexString();
  let worker = getOrCreateWorker(id);
  worker.profileMetaHash = event.params.newMetaHash;
  worker.updatedAt = event.block.timestamp;
  worker.save();
}

// =========================================================================
// LOAN HANDLERS
// =========================================================================

export function handleLoanOriginated(event: LoanOriginated): void {
  let loanId = event.params.loanId.toString();
  let loan = new Loan(loanId);
  loan.loanId = event.params.loanId;
  loan.borrower = event.params.borrower.toHexString();
  loan.principal = event.params.principal;
  loan.totalRepayable = event.params.totalRepayable;
  loan.interestRate = 0;
  loan.tier = event.params.reputationScore.toI32();
  loan.status = 0;
  loan.originatedAt = event.block.timestamp;
  loan.dueAt = event.params.dueAt;
  loan.txHash = event.transaction.hash;
  loan.save();

  let stats = getOrCreateStats();
  stats.totalLoansOriginated = stats.totalLoansOriginated.plus(BigInt.fromI32(1));
  stats.totalVolumeOriginated = stats.totalVolumeOriginated.plus(event.params.principal);
  stats.updatedAt = event.block.timestamp;
  stats.save();
}

export function handleLoanRepaid(event: LoanFullyRepaid): void {
  let loanId = event.params.loanId.toString();
  let loan = Loan.load(loanId);
  if (loan == null) {
    log.warning("Loan not found for repayment: {}", [loanId]);
    return;
  }
  loan.status = 1;
  loan.repaidAt = event.block.timestamp;
  loan.save();

  let stats = getOrCreateStats();
  stats.totalLoansRepaid = stats.totalLoansRepaid.plus(BigInt.fromI32(1));
  stats.updatedAt = event.block.timestamp;
  stats.save();
}

export function handleLoanDefaulted(event: LoanDefaulted): void {
  let loanId = event.params.loanId.toString();
  let loan = Loan.load(loanId);
  if (loan == null) {
    log.warning("Loan not found for default: {}", [loanId]);
    return;
  }
  loan.status = 2;
  loan.defaultedAt = event.block.timestamp;
  loan.save();

  let stats = getOrCreateStats();
  stats.totalLoansDefaulted = stats.totalLoansDefaulted.plus(BigInt.fromI32(1));
  stats.updatedAt = event.block.timestamp;
  stats.save();
}

// =========================================================================
// GOVERNANCE HANDLERS
// =========================================================================

export function handleProposalCreated(event: ProposalCreated): void {
  let proposalId = event.params.proposalId.toString();
  let institutionId = event.params.targetInstitution.toHexString();

  getOrCreateInstitution(institutionId).save();

  let proposal = new Proposal(proposalId);
  proposal.proposalId = event.params.proposalId;
  proposal.proposalType = event.params.proposalType;
  proposal.status = 0;
  proposal.targetInstitution = institutionId;
  proposal.newTrustLevel = 0;
  proposal.proposedBy = event.params.proposedBy;
  proposal.reason = "";
  proposal.voteCount = 0;
  proposal.requiredQuorum = 0;
  proposal.createdAt = event.block.timestamp;
  proposal.expiresAt = event.params.expiresAt;
  proposal.save();
}

export function handleVoteCast(event: VoteCast): void {
  let proposalId = event.params.proposalId.toString();
  let proposal = Proposal.load(proposalId);
  if (proposal == null) {
    log.warning("Proposal not found: {}", [proposalId]);
    return;
  }
  proposal.voteCount = event.params.voteCount.toI32();
  proposal.requiredQuorum = event.params.requiredQuorum.toI32();
  if (event.params.voteCount >= event.params.requiredQuorum) {
    proposal.status = 1;
  }
  proposal.save();

  let voteId = proposalId + "-" + event.params.voter.toHexString();
  let vote = new Vote(voteId);
  vote.proposal = proposalId;
  vote.voter = event.params.voter;
  vote.votedAt = event.block.timestamp;
  vote.save();
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  let proposalId = event.params.proposalId.toString();
  let proposal = Proposal.load(proposalId);
  if (proposal == null) {
    log.warning("Proposal not found: {}", [proposalId]);
    return;
  }
  proposal.status = 2;
  proposal.executedAt = event.block.timestamp;
  proposal.save();
}

// =========================================================================
// DISPUTE HANDLERS
// =========================================================================

export function handleDisputeRaised(event: DisputeRaised): void {
  let disputeId = event.params.disputeId.toString();
  let dispute = new Dispute(disputeId);
  dispute.disputeId = event.params.disputeId;
  dispute.disputeType = event.params.disputeType;
  dispute.status = 0;
  dispute.raiser = event.params.raiser;
  dispute.target = event.params.target;
  dispute.targetTokenId = event.params.targetTokenId;
  dispute.evidence = "";
  dispute.stake = event.params.stake;
  dispute.raisedAt = event.block.timestamp;
  dispute.save();
}

export function handleDisputeUpheld(event: DisputeUpheld): void {
  let disputeId = event.params.disputeId.toString();
  let dispute = Dispute.load(disputeId);
  if (dispute == null) {
    log.warning("Dispute not found: {}", [disputeId]);
    return;
  }
  dispute.status = 1;
  dispute.resolution = event.params.resolution;
  dispute.resolvedAt = event.block.timestamp;
  dispute.save();
}

export function handleDisputeDismissed(event: DisputeDismissed): void {
  let disputeId = event.params.disputeId.toString();
  let dispute = Dispute.load(disputeId);
  if (dispute == null) {
    log.warning("Dispute not found: {}", [disputeId]);
    return;
  }
  dispute.status = 2;
  dispute.resolution = event.params.resolution;
  dispute.resolvedAt = event.block.timestamp;
  dispute.save();
}
