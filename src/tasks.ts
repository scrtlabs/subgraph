import { Address, BigInt, Bytes, EthereumEvent, log, BigDecimal } from '@graphprotocol/graph-ts'

import {
  ReceiptFailed,
  ReceiptFailedETH,
  ReceiptVerified,
  SecretContractDeployed,
  TaskFeeReturned,
  TaskRecordCreated,
} from '../generated/EnigmaSimulation/Enigma'

import { SecretContract, Task, Worker, Epoch } from '../generated/schema'

import { toDecimal } from './token'
import { getCurrentState } from './state'
import { BIGINT_ONE, BIGINT_ZERO, isZeroAddress } from './helpers'

export function handleSecretContractDeployment(event: SecretContractDeployed): void {
  let secretContract = new SecretContract(event.params.scAddr.toHexString())
  secretContract.address = event.params.scAddr
  secretContract.codeHash = event.params.codeHash
  secretContract.initStateDeltaHash = event.params.initStateDeltaHash

  secretContract.createdAt = event.block.timestamp
  secretContract.createdAtBlock = event.block.number
  secretContract.createdAtTransaction = event.transaction.hash
  secretContract.taskCount = BIGINT_ZERO
  secretContract.userCount = BIGINT_ZERO
  secretContract.ethContractCount = BIGINT_ZERO

  if (!isZeroAddress(event.params.optionalEthereumContractAddress)) {
    let ethContracts = new Array<string>()
    ethContracts.push(event.params.optionalEthereumContractAddress.toHexString())

    secretContract.ethContracts = ethContracts
    secretContract.ethContractCount = secretContract.ethContractCount.plus(BIGINT_ONE)
  }

  secretContract.save()

  let taskId = event.params.scAddr.toHexString()
  let task = Task.load(taskId)

  if (task != null) {
    task.status = 'ReceiptVerified'
    task.secretContract = event.params.scAddr.toHexString()
    task.gasUsed = event.params.gasUsed
    task.worker = event.params.workerAddress.toHexString()
    task.optionalEthereumContractAddress = event.params.optionalEthereumContractAddress

    task.modifiedAt = event.block.timestamp
    task.modifiedAtBlock = event.block.number
    task.modifiedAtTransaction = event.transaction.hash

    let state = getCurrentState(event.address)
    state.completedTaskCount = state.completedTaskCount.plus(BIGINT_ONE)
    state.save()

    let reward = task.gasPrice.times(BigDecimal.fromString(task.gasUsed.toString()))

    let worker = Worker.load(event.params.workerAddress.toHexString())
    worker.completedTaskCount = worker.completedTaskCount.plus(BIGINT_ONE)
    worker.reward = worker.reward.plus(reward)
    worker.save()

    let epoch = Epoch.load(task.epoch)
    epoch.completedTaskCount = epoch.completedTaskCount.plus(BIGINT_ONE)
    epoch.gasUsed = epoch.gasUsed.plus(event.params.gasUsed)
    epoch.reward = epoch.reward.plus(reward)
    epoch.save()

    task.save()
  } else {
    log.warning('Task #{} not found', [taskId])
  }
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

export function handleReceiptFailed(event: ReceiptFailed): void {
  let taskId = event.params.taskId.toHexString()
  let task = Task.load(taskId)

  if (task != null) {
    task.status = 'ReceiptFailed'
    task.secretContract = event.params.scAddr.toHexString()
    task.gasUsed = event.params.gasUsed
    task.worker = event.params.workerAddress.toHexString()

    task.modifiedAt = event.block.timestamp
    task.modifiedAtBlock = event.block.number
    task.modifiedAtTransaction = event.transaction.hash

    let state = getCurrentState(event.address)
    state.failedTaskCount = state.failedTaskCount.plus(BIGINT_ONE)
    state.save()

    let reward = task.gasPrice.times(BigDecimal.fromString(task.gasUsed.toString()))

    let worker = Worker.load(event.params.workerAddress.toHexString())
    worker.failedTaskCount = worker.failedTaskCount.plus(BIGINT_ONE)
    worker.reward = worker.reward.plus(reward)
    worker.save()

    let epoch = Epoch.load(task.epoch)
    epoch.failedTaskCount = epoch.failedTaskCount.plus(BIGINT_ONE)
    epoch.gasUsed = epoch.gasUsed.plus(task.gasUsed as BigInt)
    epoch.reward = epoch.reward.plus(reward)
    epoch.save()

    let secretContract = SecretContract.load(event.params.scAddr.toHexString())
    if (secretContract != null) {
      secretContract.taskCount = secretContract.taskCount.plus(BIGINT_ONE)
      let users = secretContract.users || new Array<string>()

      if (users.indexOf(task.sender.toHexString()) == -1) {
        users.push(task.sender.toHexString())
      }

      secretContract.userCount = BigInt.fromI32(users.length)
      secretContract.users = users
      secretContract.save()
    }

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
    task.secretContract = event.params.scAddr.toHexString()
    task.gasUsed = event.params.gasUsed
    task.worker = event.params.workerAddress.toHexString()

    task.modifiedAt = event.block.timestamp
    task.modifiedAtBlock = event.block.number
    task.modifiedAtTransaction = event.transaction.hash

    let state = getCurrentState(event.address)
    state.failedTaskCount = state.failedTaskCount.plus(BIGINT_ONE)
    state.save()

    let reward = task.gasPrice.times(BigDecimal.fromString(task.gasUsed.toString()))

    let worker = Worker.load(event.params.workerAddress.toHexString())
    worker.failedTaskCount = worker.failedTaskCount.plus(BIGINT_ONE)
    worker.reward = worker.reward.plus(reward)
    worker.save()

    let epoch = Epoch.load(task.epoch)
    epoch.failedTaskCount = epoch.failedTaskCount.plus(BIGINT_ONE)
    epoch.gasUsed = epoch.gasUsed.plus(task.gasUsed as BigInt)
    epoch.reward = epoch.reward.plus(reward)
    epoch.save()

    let secretContract = SecretContract.load(event.params.scAddr.toHexString())
    if (secretContract != null) {
      secretContract.taskCount = secretContract.taskCount.plus(BIGINT_ONE)
      let users = secretContract.users || new Array<string>()

      if (users.indexOf(task.sender.toHexString()) == -1) {
        users.push(task.sender.toHexString())
      }

      secretContract.userCount = BigInt.fromI32(users.length)
      secretContract.users = users
      secretContract.save()
    }

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
    task.secretContract = event.params.scAddr.toHexString()
    task.gasUsed = event.params.gasUsed
    task.worker = event.params.workerAddress.toHexString()

    task.optionalEthereumContractAddress = event.params.optionalEthereumContractAddress

    task.modifiedAt = event.block.timestamp
    task.modifiedAtBlock = event.block.number
    task.modifiedAtTransaction = event.transaction.hash

    let state = getCurrentState(event.address)
    state.completedTaskCount = state.completedTaskCount.plus(BIGINT_ONE)
    state.save()

    let reward = task.gasPrice.times(BigDecimal.fromString(task.gasUsed.toString()))

    let worker = Worker.load(event.params.workerAddress.toHexString())
    worker.completedTaskCount = worker.completedTaskCount.plus(BIGINT_ONE)
    worker.reward = worker.reward.plus(reward)
    worker.save()

    let epoch = Epoch.load(task.epoch)
    epoch.completedTaskCount = epoch.completedTaskCount.plus(BIGINT_ONE)
    epoch.gasUsed = epoch.gasUsed.plus(event.params.gasUsed)
    epoch.reward = epoch.reward.plus(reward)
    epoch.save()

    let secretContract = SecretContract.load(event.params.scAddr.toHexString())
    secretContract.taskCount = secretContract.taskCount.plus(BIGINT_ONE)
    let users = secretContract.users || new Array<string>()

    if (users.indexOf(task.sender.toHexString()) == -1) {
      users.push(task.sender.toHexString())
    }

    if (!isZeroAddress(event.params.optionalEthereumContractAddress)) {
      let ethContracts = secretContract.ethContracts || new Array<string>()

      if (ethContracts.indexOf(event.params.optionalEthereumContractAddress.toHexString()) == -1) {
        ethContracts.push(event.params.optionalEthereumContractAddress.toHexString())
      }

      secretContract.ethContracts = ethContracts
      secretContract.ethContractCount = BigInt.fromI32(ethContracts.length)
    }

    secretContract.userCount = BigInt.fromI32(users.length)
    secretContract.users = users
    secretContract.save()

    task.save()
  } else {
    log.warning('Task #{} not found', [taskId])
  }
}

export function handleTaskFeeReturned(event: TaskFeeReturned): void {}

function createTask(
  taskId: Bytes,
  inputsHash: Bytes,
  gasLimit: BigInt,
  gasPrice: BigInt,
  sender: Address,
  event: EthereumEvent,
): Task {
  let task = new Task(taskId.toHexString())
  task.inputsHash = inputsHash
  task.gasLimit = toDecimal(gasLimit)
  task.gasPrice = toDecimal(gasPrice)
  task.sender = sender
  task.status = 'RecordCreated'

  task.createdAt = event.block.timestamp
  task.createdAtBlock = event.block.number
  task.createdAtTransaction = event.transaction.hash

  let state = getCurrentState(event.address)
  state.taskCount = state.taskCount.plus(BIGINT_ONE)
  state.save()

  task.epoch = state.latestEpoch

  let epoch = Epoch.load(state.latestEpoch)
  epoch.taskCount = epoch.taskCount.plus(BIGINT_ONE)

  let users = epoch.users || new Array<string>()

  if (users.indexOf(sender.toHexString()) == -1) {
    users.push(sender.toHexString())
  }

  epoch.userCount = BigInt.fromI32(users.length)
  epoch.users = users
  epoch.save()

  task.order = state.taskCount
  task.save()

  return task
}
