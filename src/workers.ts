import { BigInt, log } from '@graphprotocol/graph-ts'

import {
  DepositSuccessful,
  Registered,
  ValidatedSig,
  WithdrawSuccessful,
  WorkersParameterized,
} from '../generated/EnigmaSimulation/EnigmaEvents'

import { Epoch, Worker, WorkerSelection } from '../generated/schema'

import { getCurrentState } from './state'

export function handleWorkerRegistration(event: Registered): void {
  let worker = new Worker(event.params.signer.toHexString())
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
  let workerId = event.params.from.toHexString()
  let worker = Worker.load(workerId)

  if (worker != null) {
    worker.balance = worker.balance.plus(event.params.value)
  } else {
    log.warning('Worker #{} not found', [workerId])
  }
}

export function handleWorkerWithdraw(event: WithdrawSuccessful): void {
  let workerId = event.params.to.toHexString()
  let worker = Worker.load(workerId)

  if (worker != null) {
    worker.balance = worker.balance.minus(event.params.value)
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

  epoch.save()

  // Register active workers in the epoch
  let activeWorkers = event.params.workers
  let stakes = event.params.stakes

  for (let w = 0; w < activeWorkers.length; ++w) {
    let workerId = activeWorkers[w].toHexString()
    let worker = Worker.load(workerId)

    if (worker != null) {
      let selection = new WorkerSelection(epoch.id + '-' + worker.id)
      selection.epoch = epoch.id
      selection.worker = worker.id
      selection.stake = stakes[w]

      selection.save()
    } else {
      log.warning('Worker #{} not found', [workerId])
    }
  }

  // Save epoch as the latest one
  state.latestEpoch = epoch.id

  state.save()
}
