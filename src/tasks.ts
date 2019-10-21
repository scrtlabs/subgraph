import { Address, BigInt, Bytes, EthereumEvent, log, BigDecimal } from '@graphprotocol/graph-ts'

import {
  ReceiptFailed,
  ReceiptFailedETH,
  ReceiptVerified,
  SecretContractDeployed,
  TaskFeeReturned,
  TaskRecordCreated,
} from '../generated/EnigmaSimulation/EnigmaEvents'

import { SecretContract, Task, Worker, Epoch } from '../generated/schema'

import { toDecimal } from './token'
import { getCurrentState } from './state'
import { BIGINT_ONE } from './helpers'

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

// export function handleTaskRecordsCreated(event: TaskRecordsCreated): void {
//   let taskIds = event.params.taskIds
//   let inputsHashes = event.params.inputsHashes
//   let gasLimits = event.params.gasLimits
//   let gasPxs = event.params.gasPxs
//   let sender = event.params.sender

//   for (let i = 0; i < taskIds.length; ++i) {
//     createTask(taskIds[i], inputsHashes[i], gasLimits[i], gasPxs[i], sender, event)
//   }
// }

export function handleReceiptFailed(event: ReceiptFailed): void {
  let taskId = event.params.taskId.toHexString()
  let task = Task.load(taskId)

  if (task != null) {
    task.status = 'ReceiptFailed'
    task.changedAt = event.block.timestamp
    task.changedAtBlock = event.block.number
    task.changedAtTransaction = event.transaction.hash

    let state = getCurrentState(event.address)
    state.tasksFailedCount = state.tasksFailedCount.plus(BIGINT_ONE)
    state.save()

    let epoch = Epoch.load(task.epoch)
    epoch.tasksFailedCount = epoch.tasksFailedCount.plus(BIGINT_ONE)
    // epoch.gasUsed = epoch.gasUsed.plus(task.gasUsed) - FIXME: needs to add gasUsed to event params
    // epoch.reward = epoch.reward.plus(reward) - FIXME: needs to add gasUsed to event params
    epoch.save()

    task.save()
  } else {
    log.warning('Task #{} not found', [taskId])
  }
}

export function handleReceiptFailedETH(event: ReceiptFailedETH): void {
  let taskId = event.params.taskId.toHexString()
  let task = Task.load(taskId)

  if (task != null) {
    task.status = 'ReceiptFailedETH'
    task.changedAt = event.block.timestamp
    task.changedAtBlock = event.block.number
    task.changedAtTransaction = event.transaction.hash

    let state = getCurrentState(event.address)
    state.tasksFailedCount = state.tasksFailedCount.plus(BIGINT_ONE)
    state.save()

    let epoch = Epoch.load(task.epoch)
    epoch.tasksFailedCount = epoch.tasksFailedCount.plus(BIGINT_ONE)
    // epoch.gasUsed = epoch.gasUsed.plus(task.gasUsed) - FIXME: needs to add gasUsed to event params
    // eepoch.reward = epoch.reward.plus(reward) - FIXME: needs to add gasUsed to event params
    epoch.save()

    task.save()
  } else {
    log.warning('Task #{} not found', [taskId])
  }
}

export function handleReceiptVerified(event: ReceiptVerified): void {
  let taskId = event.params.taskId.toHexString()
  let task = Task.load(taskId)

  if (task != null) {
    task.status = 'ReceiptVerified'
    task.scAddr = event.params.scAddr
    task.gasUsed = event.params.gasUsed
    task.worker = event.params.workerAddress.toHexString()

    task.optionalEthereumContractAddress = event.params.optionalEthereumContractAddress

    task.changedAt = event.block.timestamp
    task.changedAtBlock = event.block.number
    task.changedAtTransaction = event.transaction.hash

    let state = getCurrentState(event.address)
    state.tasksCompletedCount = state.tasksCompletedCount.plus(BIGINT_ONE)
    state.save()

    let reward = task.gasPx.times(BigDecimal.fromString(task.gasUsed.toString()))

    let worker = Worker.load(event.params.workerAddress.toHexString())
    worker.tasksCompletedCount = worker.tasksCompletedCount.plus(BIGINT_ONE)
    worker.reward = worker.reward.plus(reward)
    worker.save()

    let epoch = Epoch.load(task.epoch)
    epoch.tasksCompletedCount = epoch.tasksCompletedCount.plus(BIGINT_ONE)
    epoch.gasUsed = epoch.gasUsed.plus(event.params.gasUsed)
    epoch.reward = epoch.reward.plus(reward)
    epoch.save()

    task.save()
  } else {
    log.warning('Task #{} not found', [taskId])
  }
}

// export function handleReceiptsVerified(event: ReceiptsVerified): void {}

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
  task.gasLimit = toDecimal(gasLimit)
  task.gasPx = toDecimal(gasPx)
  task.sender = sender
  task.status = 'RecordCreated'

  task.createdAt = event.block.timestamp
  task.createdAtBlock = event.block.number
  task.createdAtTransaction = event.transaction.hash

  let state = getCurrentState(event.address)
  state.tasksCount = state.tasksCount.plus(BIGINT_ONE)
  state.save()

  task.epoch = state.latestEpoch

  let epoch = Epoch.load(state.latestEpoch)
  epoch.tasksCount = epoch.tasksCount.plus(BIGINT_ONE)
  epoch.save()

  task.order = state.tasksCount
  task.save()

  return task
}
