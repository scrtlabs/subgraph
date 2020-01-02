import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

import { ZERO_ADDRESS, KEY_MANAGEMENT_ADDRESSES } from './constants'

export let BIGINT_ONE = BigInt.fromI32(1)
export let BIGINT_ZERO = BigInt.fromI32(0)
export let BIGDECIMAL_ZERO = BigDecimal.fromString('0')
export let BIGDECIMAL_ONE = BigDecimal.fromString('1')

export function isZeroAddress(value: Address): boolean {
  return value.toHex() == ZERO_ADDRESS
}

export function isKeyManagementAddress(value: Address): boolean {
  return KEY_MANAGEMENT_ADDRESSES.indexOf(value.toHex()) >= 0
}
