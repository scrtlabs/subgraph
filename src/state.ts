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

    state.tasksCount = BIGINT_ZERO
    state.tasksCompletedCount = BIGINT_ZERO
    state.tasksFailedCount = BIGINT_ZERO
    state.workersCount = BIGINT_ZERO

    state.save()
  }

  return state as EnigmaState
}
