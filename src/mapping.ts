import { Address, BigInt, Bytes, EthereumEvent, log } from '@graphprotocol/graph-ts'

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

import { SecretContract, Task, Worker } from '../generated/schema'

export function handleReceiptFailed(event: ReceiptFailed): void {}

export function handleReceiptFailedETH(event: ReceiptFailedETH): void {}

export function handleReceiptVerified(event: ReceiptVerified): void {}

export function handleReceiptsVerified(event: ReceiptsVerified): void {}

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

export function handleTaskFeeReturned(event: TaskFeeReturned): void {}

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
  event.params.taskIds.forEach((taskId, i) => {
    createTask(
      event.params.taskIds[i],
      event.params.inputsHashes[i],
      event.params.gasLimits[i],
      event.params.gasPxs[i],
      event.params.sender,
      event,
    )
  })
}

export function handleValidatedSig(event: ValidatedSig): void {}

export function handleWorkerRegistration(event: Registered): void {
  let worker = new Worker(event.params.custodian.toHexString())
  worker.custodianAddress = event.params.custodian
  worker.signerAddress = event.params.signer
  worker.status = 'LoggedOut'
  worker.balance = BigInt.fromI32(0)

  worker.createdAt = event.block.timestamp
  worker.createdAtBlock = event.block.number
  worker.createdAtTransaction = event.transaction.hash

  worker.save()
}

export function handleWorkerDeposit(event: DepositSuccessful): void {
  let custodianAddress = event.params.from.toHexString()
  let worker = Worker.load(custodianAddress)

  if (worker != null) {
    worker.balance = worker.balance.plus(event.params.value)
  } else {
    log.warning('Worker with custodian {} not registered', [custodianAddress])
  }
}

export function handleWorkerWithdraw(event: WithdrawSuccessful): void {
  let custodianAddress = event.params.to.toHexString()
  let worker = Worker.load(custodianAddress)

  if (worker != null) {
    worker.balance = worker.balance.minus(event.params.value)
  } else {
    log.warning('Worker with custodian {} not registered', [custodianAddress])
  }
}

export function handleWorkersParameterized(event: WorkersParameterized): void {}

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