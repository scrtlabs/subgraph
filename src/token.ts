import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

const TOKEN_DECIMALS: u8 = 8

export function toDecimal(value: BigInt, decimals: u8 = TOKEN_DECIMALS): BigDecimal {
  let precision = BigInt.fromI32(10)
    .pow(decimals)
    .toBigDecimal()

  return value.divDecimal(precision)
}
