'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAUSDC Pool', function () {
  testRunner('VAUSDC', ['StargateStrategyUSDC'], [{ debtRatio: 9000 }])
})
