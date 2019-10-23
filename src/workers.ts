import { BigDecimal, log } from '@graphprotocol/graph-ts'

import {
  DepositSuccessful,
  Registered,
  // ValidatedSig,
  WithdrawSuccessful,
  WorkersParameterized,
} from '../generated/EnigmaSimulation/Enigma'

import { Epoch, Worker, WorkerSigner } from '../generated/schema'

import { getCurrentState } from './state'
import { toDecimal } from './token'
import { BIGINT_ZERO, BIGINT_ONE, BIGDECIMAL_ZERO, BIGDECIMAL_ONE } from './helpers'

export function handleWorkerRegistration(event: Registered): void {
  let worker = new Worker(event.params.custodian.toHexString())
  worker.custodianAddress = event.params.custodian
  worker.signerAddress = event.params.signer
  worker.status = 'LoggedOut'
  worker.balance = BigDecimal.fromString('0')
  worker.epochs = []

  worker.completedTaskCount = BIGINT_ZERO
  worker.failedTaskCount = BIGINT_ZERO
  worker.epochCount = BIGINT_ZERO

  worker.createdAt = event.block.timestamp
  worker.createdAtBlock = event.block.number
  worker.createdAtTransaction = event.transaction.hash

  worker.save()

  let workerSigner = new WorkerSigner(event.params.signer.toHexString())
  workerSigner.custodianAddress = event.params.custodian
  workerSigner.save()

  let state = getCurrentState(event.address)
  state.workerCount = state.workerCount.plus(BIGINT_ONE)
  state.save()
}

export function handleWorkerDeposit(event: DepositSuccessful): void {
  let workerId = event.params.from.toHexString()
  let worker = Worker.load(workerId)

  if (worker != null) {
    worker.balance = worker.balance.plus(toDecimal(event.params.value))
    worker.save()
  } else {
    log.warning('Worker #{} not found', [workerId])
  }
}

export function handleWorkerWithdraw(event: WithdrawSuccessful): void {
  let workerId = event.params.to.toHexString()
  let worker = Worker.load(workerId)

  if (worker != null) {
    worker.balance = worker.balance.minus(toDecimal(event.params.value))
    worker.save()
  } else {
    log.warning('Worker #{} not found', [workerId])
  }
}

export function handleWorkersParameterized(event: WorkersParameterized): void {
  let state = getCurrentState(event.address)

  let epoch = new Epoch(event.params.nonce.toString())
  epoch.startBlockNumber = event.params.firstBlockNumber
  epoch.inclusionBlockNumber = event.params.inclusionBlockNumber
  epoch.seed = event.params.seed
  epoch.startTime = event.block.timestamp
  epoch.order = event.params.nonce
  epoch.workers = new Array<string>()

  epoch.endTime = BIGINT_ZERO
  epoch.workerCount = BIGINT_ZERO
  epoch.taskCount = BIGINT_ZERO
  epoch.completedTaskCount = BIGINT_ZERO
  epoch.failedTaskCount = BIGINT_ZERO
  epoch.gasUsed = BIGINT_ZERO
  epoch.reward = BIGDECIMAL_ZERO

  // Register active workers in the epoch
  let activeWorkers = event.params.workers.map<string>(w => w.toHexString())

  for (let w = 0; w < activeWorkers.length; ++w) {
    let workerSignerId = activeWorkers[w]
    let workerSigner = WorkerSigner.load(workerSignerId)

    if (workerSigner != null) {
      let workerId = workerSigner.custodianAddress.toHexString()
      let worker = Worker.load(workerId)

      if (worker != null) {
        let workerEpochs = worker.epochs
        workerEpochs.push(epoch.id)

        worker.epochs = workerEpochs
        worker.epochCount = worker.epochCount.plus(BIGINT_ONE)

        worker.save()
        epoch.workers = epoch.workers.concat([workerId])
        epoch.workerCount = epoch.workerCount.plus(BIGINT_ONE)
      } else {
        log.warning('Worker #{} not found', [workerId])
      }
    } else {
      log.warning('Worker with signer #{} not found', [workerSignerId])
    }
  }

  epoch.save()

  if (event.params.nonce.notEqual(BIGINT_ZERO)) {
    let prevEpoch = Epoch.load(state.latestEpoch)
    prevEpoch.endTime = event.block.timestamp
    prevEpoch.save()
  }

  // Save epoch as the latest one
  state.latestEpoch = epoch.id

  state.save()
}