import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
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
} from "../generated/CredentialRegistry/CredentialRegistry"

export function createCredentialIssuedEvent(
  institution: Address,
  holder: Address,
  tokenId: BigInt,
  credentialType: i32
): CredentialIssued {
  let credentialIssuedEvent = changetype<CredentialIssued>(newMockEvent())

  credentialIssuedEvent.parameters = new Array()

  credentialIssuedEvent.parameters.push(
    new ethereum.EventParam(
      "institution",
      ethereum.Value.fromAddress(institution)
    )
  )
  credentialIssuedEvent.parameters.push(
    new ethereum.EventParam("holder", ethereum.Value.fromAddress(holder))
  )
  credentialIssuedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  credentialIssuedEvent.parameters.push(
    new ethereum.EventParam(
      "credentialType",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(credentialType))
    )
  )

  return credentialIssuedEvent
}

export function createInstitutionAppliedEvent(
  wallet: Address,
  name: string,
  country: string,
  appliedAt: BigInt
): InstitutionApplied {
  let institutionAppliedEvent = changetype<InstitutionApplied>(newMockEvent())

  institutionAppliedEvent.parameters = new Array()

  institutionAppliedEvent.parameters.push(
    new ethereum.EventParam("wallet", ethereum.Value.fromAddress(wallet))
  )
  institutionAppliedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  institutionAppliedEvent.parameters.push(
    new ethereum.EventParam("country", ethereum.Value.fromString(country))
  )
  institutionAppliedEvent.parameters.push(
    new ethereum.EventParam(
      "appliedAt",
      ethereum.Value.fromUnsignedBigInt(appliedAt)
    )
  )

  return institutionAppliedEvent
}

export function createInstitutionApprovedEvent(
  wallet: Address,
  trustLevel: i32,
  approvedAt: BigInt
): InstitutionApproved {
  let institutionApprovedEvent = changetype<InstitutionApproved>(newMockEvent())

  institutionApprovedEvent.parameters = new Array()

  institutionApprovedEvent.parameters.push(
    new ethereum.EventParam("wallet", ethereum.Value.fromAddress(wallet))
  )
  institutionApprovedEvent.parameters.push(
    new ethereum.EventParam(
      "trustLevel",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(trustLevel))
    )
  )
  institutionApprovedEvent.parameters.push(
    new ethereum.EventParam(
      "approvedAt",
      ethereum.Value.fromUnsignedBigInt(approvedAt)
    )
  )

  return institutionApprovedEvent
}

export function createInstitutionRevokedEvent(
  wallet: Address,
  revokedBy: Address,
  reason: string
): InstitutionRevoked {
  let institutionRevokedEvent = changetype<InstitutionRevoked>(newMockEvent())

  institutionRevokedEvent.parameters = new Array()

  institutionRevokedEvent.parameters.push(
    new ethereum.EventParam("wallet", ethereum.Value.fromAddress(wallet))
  )
  institutionRevokedEvent.parameters.push(
    new ethereum.EventParam("revokedBy", ethereum.Value.fromAddress(revokedBy))
  )
  institutionRevokedEvent.parameters.push(
    new ethereum.EventParam("reason", ethereum.Value.fromString(reason))
  )

  return institutionRevokedEvent
}

export function createInstitutionTrustLevelUpdatedEvent(
  wallet: Address,
  oldLevel: i32,
  newLevel: i32
): InstitutionTrustLevelUpdated {
  let institutionTrustLevelUpdatedEvent =
    changetype<InstitutionTrustLevelUpdated>(newMockEvent())

  institutionTrustLevelUpdatedEvent.parameters = new Array()

  institutionTrustLevelUpdatedEvent.parameters.push(
    new ethereum.EventParam("wallet", ethereum.Value.fromAddress(wallet))
  )
  institutionTrustLevelUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldLevel",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(oldLevel))
    )
  )
  institutionTrustLevelUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newLevel",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(newLevel))
    )
  )

  return institutionTrustLevelUpdatedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPausedEvent(account: Address): Paused {
  let pausedEvent = changetype<Paused>(newMockEvent())

  pausedEvent.parameters = new Array()

  pausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return pausedEvent
}

export function createUnpausedEvent(account: Address): Unpaused {
  let unpausedEvent = changetype<Unpaused>(newMockEvent())

  unpausedEvent.parameters = new Array()

  unpausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return unpausedEvent
}

export function createWorkerIdentityContractUpdatedEvent(
  oldContract: Address,
  newContract: Address
): WorkerIdentityContractUpdated {
  let workerIdentityContractUpdatedEvent =
    changetype<WorkerIdentityContractUpdated>(newMockEvent())

  workerIdentityContractUpdatedEvent.parameters = new Array()

  workerIdentityContractUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldContract",
      ethereum.Value.fromAddress(oldContract)
    )
  )
  workerIdentityContractUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newContract",
      ethereum.Value.fromAddress(newContract)
    )
  )

  return workerIdentityContractUpdatedEvent
}
