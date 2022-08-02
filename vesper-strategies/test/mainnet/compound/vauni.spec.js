'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAUNI Pool', function () {
  testRunner('VAUNI', ['Compound_UNI'], [{ debtRatio: 9000 }])
})
