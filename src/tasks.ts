import { Address, BigInt, Bytes, EthereumEvent } from '@graphprotocol/graph-ts'

import {
  ReceiptFailed,
  ReceiptFailedETH,
  ReceiptsVerified,
  ReceiptVerified,
  SecretContractDeployed,
  TaskFeeReturned,
  TaskRecordCreated,
  TaskRecordsCreated,
} from '../generated/EnigmaSimulation/EnigmaEvents'

import { SecretContract, Task } from '../generated/schema'

export function handleSecretContractDeployment(event: SecretContractDeployed): void {
  let secretContract = new SecretContract(event.params.scAddr.toHexString())
  secretContract.address = event.params.scAddr
  secretContract.codeHash = event.params.codeHash
  secretContract.initStateDeltaHash = event.params.initStateDeltaHash

  secretContract.createdAt = event.block.timestamp
  secretContract.createdAtBlock = event.block.number
  secretContract.createdAtTransaction = event.transaction.hash

  secretContract.save()
}

export function handleTaskRecordCreated(event: TaskRecordCreated): void {
  createTask(
    event.params.taskId,
    event.params.inputsHash,
    event.params.gasLimit,
    event.params.gasPx,
    event.params.sender,
    event,
  )
}

export function handleTaskRecordsCreated(event: TaskRecordsCreated): void {
  let taskIds = event.params.taskIds
  let inputsHashes = event.params.inputsHashes
  let gasLimits = event.params.gasLimits
  let gasPxs = event.params.gasPxs
  let sender = event.params.sender

  for (let i = 0; i < taskIds.length; ++i) {
    createTask(taskIds[i], inputsHashes[i], gasLimits[i], gasPxs[i], sender, event)
  }
}

export function handleReceiptFailed(event: ReceiptFailed): void {}

export function handleReceiptFailedETH(event: ReceiptFailedETH): void {}

export function handleReceiptVerified(event: ReceiptVerified): void {}

export function handleReceiptsVerified(event: ReceiptsVerified): void {}

export function handleTaskFeeReturned(event: TaskFeeReturned): void {}

function createTask(
  taskId: Bytes,
  inputsHash: Bytes,
  gasLimit: BigInt,
  gasPx: BigInt,
  sender: Address,
  event: EthereumEvent,
): Task {
  let task = new Task(taskId.toHexString())
  task.inputsHash = inputsHash
  task.gasLimit = gasLimit
  task.gasPx = gasPx
  task.sender = sender
  task.status = 'RecordCreated'

  task.createdAt = event.block.timestamp
  task.createdAtBlock = event.block.number
  task.createdAtTransaction = event.transaction.hash

  task.save()

  return task
}
