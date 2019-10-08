import { BigInt, log } from '@graphprotocol/graph-ts'

import {
  DepositSuccessful,
  Registered,
  ValidatedSig,
  WithdrawSuccessful,
  WorkersParameterized,
} from '../../generated/EnigmaSimulation/EnigmaEvents'

import { Epoch, Worker } from '../../generated/schema'

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

export function handleValidatedSig(event: ValidatedSig): void {
  // Unused event
}

export function handleWorkersParameterized(event: WorkersParameterized): void {
  let epoch = new Epoch(event.params.nonce.toString())
  epoch.seed = event.params.seed
  epoch.firstBlockNumber = event.params.firstBlockNumber
  epoch.inclusionBlockNumber = event.params.inclusionBlockNumber

  epoch.save()

  // TODO: Register workers in the epoch
  // let workers = event.params.workers
  //
  // for (let w = 0; w < workers.length; ++w) {
  //   let workerId = workers[w].toHexString()
  //
  //   let entity = new EpochWorker(epoch.id + '-' + workerId)
  //   entity.epoch = epoch.id
  //   entity.worker = workerId
  //
  //   entity.save()
  // }
}
