import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { Statistic } from '../generated/schema'
import { BIGINT_ZERO, BIGINT_ONE } from './helpers'

export let DAY_IN_SECONDS = BigDecimal.fromString('86400')
export let HOUR_IN_SECONDS = BigDecimal.fromString('3600')

let HOUR_TYPE = 'HOUR'
let DAY_TYPE = 'DAY'

export function addStatisticsTask(timestamp: BigInt): void {
  let dailyStatistics = getDayStatistics(timestamp)
  dailyStatistics.taskCount = dailyStatistics.taskCount.plus(BIGINT_ONE)
  dailyStatistics.save()

  let hourlyStatistics = getHourStatistics(timestamp)
  hourlyStatistics.taskCount = hourlyStatistics.taskCount.plus(BIGINT_ONE)
  hourlyStatistics.save()
}

export function addStatisticsFailedTask(timestamp: BigInt): void {
  let dailyStatistics = getDayStatistics(timestamp)
  dailyStatistics.failedTaskCount = dailyStatistics.failedTaskCount.plus(BIGINT_ONE)
  dailyStatistics.save()

  let hourlyStatistics = getHourStatistics(timestamp)
  hourlyStatistics.failedTaskCount = hourlyStatistics.failedTaskCount.plus(BIGINT_ONE)
  hourlyStatistics.save()
}

export function addStatisticsCompletedTask(timestamp: BigInt): void {
  let dailyStatistics = getDayStatistics(timestamp)
  dailyStatistics.completedTaskCount = dailyStatistics.completedTaskCount.plus(BIGINT_ONE)
  dailyStatistics.save()

  let hourlyStatistics = getHourStatistics(timestamp)
  hourlyStatistics.completedTaskCount = hourlyStatistics.completedTaskCount.plus(BIGINT_ONE)
  hourlyStatistics.save()
}

export function addStatisticsEpoch(timestamp: BigInt, startedEpoch: string, endedEpoch: string): void {
  let dailyStatistics = getDayStatistics(timestamp)
  let dailyStartedEpochs = dailyStatistics.startedEpochs || new Array<string>()
  let dailyEndedEpochs = dailyStatistics.endedEpochs || new Array<string>()

  if (dailyStartedEpochs.indexOf(startedEpoch) == -1) {
    dailyStartedEpochs.push(startedEpoch)
  }

  if (dailyEndedEpochs.indexOf(endedEpoch) == -1) {
    dailyEndedEpochs.push(endedEpoch)
  }

  dailyStatistics.startedEpochCount = BigInt.fromI32(dailyStartedEpochs.length)
  dailyStatistics.startedEpochs = dailyStartedEpochs
  dailyStatistics.endedEpochCount = BigInt.fromI32(dailyEndedEpochs.length)
  dailyStatistics.endedEpochs = dailyEndedEpochs

  dailyStatistics.save()

  let hourlyStatistics = getHourStatistics(timestamp)
  let hourlyStartedEpochs = hourlyStatistics.startedEpochs || new Array<string>()
  let hourlyEndedEpochs = hourlyStatistics.endedEpochs || new Array<string>()

  if (hourlyStartedEpochs.indexOf(startedEpoch) == -1) {
    hourlyStartedEpochs.push(startedEpoch)
  }

  if (hourlyEndedEpochs.indexOf(endedEpoch) == -1) {
    hourlyEndedEpochs.push(endedEpoch)
  }

  hourlyStatistics.startedEpochCount = BigInt.fromI32(hourlyStartedEpochs.length)
  hourlyStatistics.startedEpochs = hourlyStartedEpochs
  hourlyStatistics.endedEpochCount = BigInt.fromI32(hourlyEndedEpochs.length)
  hourlyStatistics.endedEpochs = hourlyEndedEpochs

  hourlyStatistics.save()
}

export function addStatisticsUsers(timestamp: BigInt, userAddress: string): void {
  let dailyStatistics = getDayStatistics(timestamp)
  let dailyUsers = dailyStatistics.users || new Array<string>()

  if (dailyUsers.indexOf(userAddress) == -1) {
    dailyUsers.push(userAddress)
  }

  dailyStatistics.userCount = BigInt.fromI32(dailyUsers.length)
  dailyStatistics.users = dailyUsers

  dailyStatistics.save()

  let hourlyStatistics = getHourStatistics(timestamp)
  let hourlyUsers = hourlyStatistics.users || new Array<string>()

  if (hourlyUsers.indexOf(userAddress) == -1) {
    hourlyUsers.push(userAddress)
  }

  hourlyStatistics.userCount = BigInt.fromI32(hourlyUsers.length)
  hourlyStatistics.users = hourlyUsers

  hourlyStatistics.save()
}

export function addStatisticsWorkers(timestamp: BigInt, workers: string[]): void {
  if (workers.length < 1) {
    return
  }

  let dailyStatistics = getDayStatistics(timestamp)
  let hourlyStatistics = getHourStatistics(timestamp)

  let dailyWorkers = dailyStatistics.workers || new Array<string>()
  let hourlyWorkers = hourlyStatistics.workers || new Array<string>()

  for (let w = 0; w < workers.length; ++w) {
    if (dailyWorkers.indexOf(workers[w]) == -1) {
      dailyWorkers.push(workers[w])
    }

    if (hourlyWorkers.indexOf(workers[w]) == -1) {
      hourlyWorkers.push(workers[w])
    }
  }

  dailyStatistics.workerCount = BigInt.fromI32(dailyWorkers.length)
  dailyStatistics.workers = dailyWorkers
  dailyStatistics.save()

  hourlyStatistics.workerCount = BigInt.fromI32(hourlyWorkers.length)
  hourlyStatistics.workers = hourlyWorkers
  hourlyStatistics.save()
}

function getDayStatistics(timestamp: BigInt): Statistic {
  return getStatistics(getDayId(timestamp), getDay(timestamp), DAY_TYPE)
}

function getHourStatistics(timestamp: BigInt): Statistic {
  return getStatistics(getHourId(timestamp), getHour(timestamp), HOUR_TYPE)
}

function getStatistics(id: string, order: BigDecimal, type: string): Statistic {
  let statistics = Statistic.load(id)
  if (statistics == null) {
    statistics = new Statistic(id)
    statistics.taskCount = BIGINT_ZERO
    statistics.completedTaskCount = BIGINT_ZERO
    statistics.failedTaskCount = BIGINT_ZERO
    statistics.startedEpochCount = BIGINT_ZERO
    statistics.endedEpochCount = BIGINT_ZERO
    statistics.userCount = BIGINT_ZERO
    statistics.workerCount = BIGINT_ZERO
    statistics.type = type
    statistics.order = order

    statistics.save()
  }
  return statistics as Statistic
}

function getDayId(timestamp: BigInt): string {
  return DAY_TYPE + '-' + getDay(timestamp).toString()
}

function getHourId(timestamp: BigInt): string {
  return HOUR_TYPE + '-' + getHour(timestamp).toString()
}


function getDay(timestamp: BigInt): BigDecimal {
  return timestamp.divDecimal(DAY_IN_SECONDS).truncate(0)
}

function getHour(timestamp: BigInt): BigDecimal {
  return timestamp.divDecimal(HOUR_IN_SECONDS).truncate(0)
}
