import { BigDecimal, log } from '@graphprotocol/graph-ts'

import {
  DepositSuccessful,
  Registered,
  ValidatedSig,
  WithdrawSuccessful,
  WorkersParameterized,
} from '../generated/EnigmaSimulation/EnigmaEvents'

import { Epoch, Worker } from '../generated/schema'

import { getCurrentState } from './state'
import { toDecimal } from './token'

export function handleWorkerRegistration(event: Registered): void {
  let worker = new Worker(event.params.signer.toHexString())
  worker.custodianAddress = event.params.custodian
  worker.signerAddress = event.params.signer
  worker.status = 'LoggedOut'
  worker.balance = BigDecimal.fromString('0')
  worker.epochs = []

  worker.createdAt = event.block.timestamp
  worker.createdAtBlock = event.block.number
  worker.createdAtTransaction = event.transaction.hash

  worker.save()
}

export function handleWorkerDeposit(event: DepositSuccessful): void {
  let workerId = event.params.from.toHexString()
  let worker = Worker.load(workerId)

  if (worker != null) {
    worker.balance = worker.balance.plus(toDecimal(event.params.value))
  } else {
    log.warning('Worker #{} not found', [workerId])
  }
}

export function handleWorkerWithdraw(event: WithdrawSuccessful): void {
  let workerId = event.params.to.toHexString()
  let worker = Worker.load(workerId)

  if (worker != null) {
    worker.balance = worker.balance.minus(toDecimal(event.params.value))
  } else {
    log.warning('Worker #{} not found', [workerId])
  }
}

export function handleValidatedSig(event: ValidatedSig): void {
  // Unused event
}

export function handleWorkersParameterized(event: WorkersParameterized): void {
  let state = getCurrentState(event.address)

  let epoch = new Epoch(event.params.nonce.toString())
  epoch.startBlockNumber = event.params.firstBlockNumber
  epoch.completeBlockNumber = event.params.firstBlockNumber.plus(state.epochSize)
  epoch.inclusionBlockNumber = event.params.inclusionBlockNumber
  epoch.seed = event.params.seed
  epoch.startTime = event.block.timestamp
  epoch.workers = event.params.workers.map<string>(w => w.toHexString())

  epoch.save()

  // Register active workers in the epoch
  let activeWorkers = epoch.workers

  for (let w = 0; w < activeWorkers.length; ++w) {
    let workerId = activeWorkers[w]
    let worker = Worker.load(workerId)

    if (worker != null) {
      let workerEpochs = worker.epochs
      workerEpochs.push(epoch.id)

      worker.epochs = workerEpochs

      worker.save()
    } else {
      log.warning('Worker #{} not found', [workerId])
    }
  }

  // Save epoch as the latest one
  state.latestEpoch = epoch.id

  state.save()
}
