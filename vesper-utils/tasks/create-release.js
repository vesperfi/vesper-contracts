'use strict'

const fs = require('fs')
const _ = require('lodash')

const readFileAsJson = fileName => JSON.parse(fs.readFileSync(fileName).toString())

const getAddress = fileName => readFileAsJson(fileName).address

// Return object of deployment name and address
function getReleaseData(network) {
  const networkDir = `./deployments/${network}`
  const data = fs.readdirSync(networkDir).map(function (fileName) {
    if (fileName.includes('.json')) {
      return {
        [fileName.split('.json')[0]]: getAddress(`${networkDir}/${fileName}`),
      }
    }
    return {}
  })
  return _.merge({}, ...data)
}

task('create-release', 'Create release file from deploy data').setAction(async function () {
  const networksDir = './deployments'
  const releaseDir = 'releases/'
  const releaseFile = `${releaseDir}/contracts.json`

  let release = {}

  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir, { recursive: true })
  }

  // Iterate over supported chains read deployment data to generate release
  fs.readdirSync(networksDir).forEach(
    network =>
      // Update release data from latest deployment
      (release[network] = getReleaseData(network)),
  )

  // Write release into file
  fs.writeFileSync(releaseFile, JSON.stringify(release, null, 2))
})

module.exports = {}
