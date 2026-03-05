import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { CredentialIssued } from "../generated/schema"
import { CredentialIssued as CredentialIssuedEvent } from "../generated/CredentialRegistry/CredentialRegistry"
import { handleCredentialIssued } from "../src/credential-registry"
import { createCredentialIssuedEvent } from "./credential-registry-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let institution = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let holder = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let tokenId = BigInt.fromI32(234)
    let credentialType = 123
    let newCredentialIssuedEvent = createCredentialIssuedEvent(
      institution,
      holder,
      tokenId,
      credentialType
    )
    handleCredentialIssued(newCredentialIssuedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("CredentialIssued created and stored", () => {
    assert.entityCount("CredentialIssued", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "CredentialIssued",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "institution",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "CredentialIssued",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "holder",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "CredentialIssued",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "tokenId",
      "234"
    )
    assert.fieldEquals(
      "CredentialIssued",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "credentialType",
      "123"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
