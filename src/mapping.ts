import {
  DepositSuccessful,
  ReceiptFailed,
  ReceiptFailedETH,
  ReceiptsVerified,
  ReceiptVerified,
  Registered,
  SecretContractDeployed,
  TaskFeeReturned,
  TaskRecordCreated,
  TaskRecordsCreated,
  ValidatedSig,
  WithdrawSuccessful,
  WorkersParameterized,
} from '../generated/EnigmaSimulation/EnigmaEvents'

import { SecretContract } from '../generated/schema'

export function handleDepositSuccessful(event: DepositSuccessful): void {}

export function handleReceiptFailed(event: ReceiptFailed): void {}

export function handleReceiptFailedETH(event: ReceiptFailedETH): void {}

export function handleReceiptVerified(event: ReceiptVerified): void {}

export function handleReceiptsVerified(event: ReceiptsVerified): void {}

export function handleRegistered(event: Registered): void {}

export function handleSecretContractDeployed(event: SecretContractDeployed): void {
  let secretContract = new SecretContract(event.params.scAddr.toHexString())
  secretContract.address = event.params.scAddr
  secretContract.codeHash = event.params.codeHash
  secretContract.initStateDeltaHash = event.params.initStateDeltaHash

  secretContract.createdAt = event.block.timestamp
  secretContract.createdAtBlock = event.block.number
  secretContract.createdAtTransaction = event.transaction.hash

  secretContract.save()
}

export function handleTaskFeeReturned(event: TaskFeeReturned): void {}

export function handleTaskRecordCreated(event: TaskRecordCreated): void {}

export function handleTaskRecordsCreated(event: TaskRecordsCreated): void {}

export function handleValidatedSig(event: ValidatedSig): void {}

export function handleWithdrawSuccessful(event: WithdrawSuccessful): void {}

export function handleWorkersParameterized(event: WorkersParameterized): void {}
