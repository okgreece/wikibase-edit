const config = require('config')
const wbk = require('wikibase-sdk')({ instance: config.instance })
const sandboxProperties = {}
const fetch = require('lib/request/fetch')
const wbEdit = require('root')(config)
const { randomString } = require('test/unit/utils')

module.exports = async ({ datatype, reserved }) => {
  if (!datatype) throw new Error('missing datatype')
  if (reserved) return createProperty(datatype)
  const property = await getProperty(datatype)
  sandboxProperties[datatype] = property
  return property
}

const getProperty = async datatype => {
  const pseudoPropertyId = getPseudoPropertyId(datatype)

  const cachedPropertyId = sandboxProperties[pseudoPropertyId]

  if (cachedPropertyId) return cachedPropertyId

  const foundPropertyId = await findOnWikibase(pseudoPropertyId)
  if (foundPropertyId) return foundPropertyId
  else return createProperty(datatype)
}

const findOnWikibase = async pseudoPropertyId => {
  const url = wbk.searchEntities({ search: pseudoPropertyId, type: 'property' })
  const body = await fetch(url).then(res => res.json())
  const firstWbResult = body.search[0]
  if (firstWbResult) return firstWbResult
}

const createProperty = async datatype => {
  const pseudoPropertyId = getPseudoPropertyId(datatype)
  const res = await wbEdit.entity.create({
    type: 'property',
    datatype,
    labels: {
      // Including a random string to avoid conflicts in case a property with that pseudoPropertyId
      // already exist but wasn't found due to a problem in ElasticSearch
      en: `${pseudoPropertyId} (${randomString()})`
    }
  })
  return res.entity
}

const getPseudoPropertyId = datatype => `${datatype} sandbox property`
