import {
  CredentialIssued as CredentialIssuedEvent,
  InstitutionApplied as InstitutionAppliedEvent,
  InstitutionApproved as InstitutionApprovedEvent,
  InstitutionRevoked as InstitutionRevokedEvent,
  InstitutionTrustLevelUpdated as InstitutionTrustLevelUpdatedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Paused as PausedEvent,
  Unpaused as UnpausedEvent,
  WorkerIdentityContractUpdated as WorkerIdentityContractUpdatedEvent
} from "../generated/CredentialRegistry/CredentialRegistry"
import {
  CredentialIssued,
  InstitutionApplied,
  InstitutionApproved,
  InstitutionRevoked,
  InstitutionTrustLevelUpdated,
  OwnershipTransferred,
  Paused,
  Unpaused,
  WorkerIdentityContractUpdated
} from "../generated/schema"

export function handleCredentialIssued(event: CredentialIssuedEvent): void {
  let entity = new CredentialIssued(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.institution = event.params.institution
  entity.holder = event.params.holder
  entity.tokenId = event.params.tokenId
  entity.credentialType = event.params.credentialType

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInstitutionApplied(event: InstitutionAppliedEvent): void {
  let entity = new InstitutionApplied(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.wallet = event.params.wallet
  entity.name = event.params.name
  entity.country = event.params.country
  entity.appliedAt = event.params.appliedAt

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInstitutionApproved(
  event: InstitutionApprovedEvent
): void {
  let entity = new InstitutionApproved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.wallet = event.params.wallet
  entity.trustLevel = event.params.trustLevel
  entity.approvedAt = event.params.approvedAt

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInstitutionRevoked(event: InstitutionRevokedEvent): void {
  let entity = new InstitutionRevoked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.wallet = event.params.wallet
  entity.revokedBy = event.params.revokedBy
  entity.reason = event.params.reason

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInstitutionTrustLevelUpdated(
  event: InstitutionTrustLevelUpdatedEvent
): void {
  let entity = new InstitutionTrustLevelUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.wallet = event.params.wallet
  entity.oldLevel = event.params.oldLevel
  entity.newLevel = event.params.newLevel

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePaused(event: PausedEvent): void {
  let entity = new Paused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUnpaused(event: UnpausedEvent): void {
  let entity = new Unpaused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleWorkerIdentityContractUpdated(
  event: WorkerIdentityContractUpdatedEvent
): void {
  let entity = new WorkerIdentityContractUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldContract = event.params.oldContract
  entity.newContract = event.params.newContract

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
