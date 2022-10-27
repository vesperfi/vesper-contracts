'use strict'

// See `PoolType` enum in `Curve.sol` file
const CurvePoolType = {
  PLAIN_2_POOL: 0,
  PLAIN_3_POOL: 1,
  PLAIN_4_POOL: 2,
  LENDING_2_POOL: 3,
  LENDING_3_POOL: 4,
  LENDING_4_POOL: 5,
  META_3_POOL: 6,
  META_4_POOL: 7,
}

module.exports = Object.freeze(CurvePoolType)
