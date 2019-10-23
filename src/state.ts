import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Enigma } from '../generated/EnigmaSimulation/Enigma'

import { EnigmaState } from '../generated/schema'

import { BIGINT_ZERO } from './helpers'

const ENIGMA_STATE_KEY = '0'

export function getCurrentState(principal?: Address): EnigmaState {
  let state = EnigmaState.load(ENIGMA_STATE_KEY)

  if (state == null) {
    state = new EnigmaState(ENIGMA_STATE_KEY)

    if (principal != null) {
      let storage = Enigma.bind(principal)

      state.epochSize = storage.getEpochSize()
    } else {
      state.epochSize = BigInt.fromI32(0)
    }

    state.taskCount = BIGINT_ZERO
    state.completedTaskCount = BIGINT_ZERO
    state.failedTaskCount = BIGINT_ZERO
    state.workerCount = BIGINT_ZERO

    state.save()
  }

  return state as EnigmaState
}
