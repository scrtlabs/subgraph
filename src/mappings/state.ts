import { Address, BigInt } from '@graphprotocol/graph-ts'

import { EnigmaStorage } from '../../generated/EnigmaSimulation/EnigmaStorage'

import { EnigmaState } from '../../generated/schema'

const ENIGMA_STATE_KEY = '0'

export function getCurrentState(principal?: Address): EnigmaState {
  let state = EnigmaState.load(ENIGMA_STATE_KEY)

  if (state == null) {
    state = new EnigmaState(ENIGMA_STATE_KEY)

    if (principal != null) {
      let storage = EnigmaStorage.bind(principal)

      state.epochSize = storage.getEpochSize()
    } else {
      state.epochSize = BigInt.fromI32(0)
    }

    state.save()
  }

  return state as EnigmaState
}
