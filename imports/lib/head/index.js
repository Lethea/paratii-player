function setHead () {
  Picker.route('/play/:_id', (params, req, res, next) => {
    // console.log('calling home')
    // console.log(params)
    // console.log(req)
    basicHead(params, req, res, next)
    twitterCardHead(params, req, res, next)

    next()
  })

  Picker.route('/oembed', (params, req, res, next) => {
    // console.log('calling home')
    // console.log(params)
    // console.log(req)
    var oembedresponse = {}
    if (params.query.url === undefined) {
      oembedresponse.error = 'urlMissing'
      res.end(JSON.stringify(oembedresponse))
    }

    var parsedExternalUrl = parseUrl(params.query.url)
    var parsedInternalUrl = parseUrl(Meteor.absoluteUrl.defaultOptions.rootUrl.replace(/\/$/, ''))

    res.setHeader('Content-Type', 'application/json')
    if (
      parsedExternalUrl.protocol === parsedInternalUrl.protocol &&
      parsedExternalUrl.host === parsedInternalUrl.host &&
      parsedExternalUrl.port === parsedInternalUrl.port
    ) {
      oembedresponse.version = '1.0'
      oembedresponse.type = 'rich'
      oembedresponse.provider_name = 'Paratii'
      oembedresponse.provider_url = Meteor.absoluteUrl.defaultOptions.rootUrl.replace(/\/$/, '')
      oembedresponse.author_name = 'Creator name'
      oembedresponse.author_url = 'Creator url, maybe the channel?'
      // TODO: get iframe code
      oembedresponse.html = 'iframe code'
      oembedresponse.width = 570
      oembedresponse.height = 320
      oembedresponse.thumbnail_url = 'url for thumbnail'
      oembedresponse.thumbnail_width = 825
      oembedresponse.thumbnail_height = 825
      oembedresponse.referrer = ''
      oembedresponse.cache_age = 3600
    } else {
      oembedresponse.error = 'denied'
    }

    res.end(JSON.stringify(oembedresponse))
    next()
  })

  Picker.route('(.*)', (params, req, res, next) => {
    // console.log('calling home')
    // console.log(params)
    // console.log(req)
    basicHead(params, req, res, next)

    next()
  })
}
function twitterCardHead (params, req, res, next) {
  var rootUrl = Meteor.absoluteUrl.defaultOptions.rootUrl.replace(/\/$/, '')
  req.dynamicHead = (req.dynamicHead || '')
  var videoID = params._id
  req.dynamicHead += '<meta property="twitter:card" content="player" />'
  req.dynamicHead += '<meta property="twitter:title" content="Custom player inside a twitter card" />'
  req.dynamicHead += '<meta property="twitter:site" content="https://gateway.ipfs.io/ipfs/QmcSHvFsGEU36viAkXo5PAkz1YgsorzT5LXR8uAnugJ7Hg">'
  req.dynamicHead += '<meta property="twitter:player:width" content="500" />'
  req.dynamicHead += '<meta property="twitter:player:height" content="500" />'
  req.dynamicHead += '<meta property="twitter:image" content="' + rootUrl + '/img/icon/apple-touch-icon.png" />'
  req.dynamicHead += '<meta property="twitter:player:stream" content="https://gateway.ipfs.io/ipfs/QmcSHvFsGEU36viAkXo5PAkz1YgsorzT5LXR8uAnugJ7Hg" />'
  req.dynamicHead += '<meta property="twitter:player" content="' + rootUrl + '/embed/' + videoID + '" />'
}

function basicHead (params, req, res, next) {
  req.dynamicHead = (req.dynamicHead || '')
  req.dynamicHead += '<title>Paratii Media Player</title>'

  req.dynamicHead += '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">'
  req.dynamicHead += '<meta name="theme-color" content="#ffffff">'
  req.dynamicHead += '<link href="https://fonts.google.com/specimen/Roboto?selection.family=Roboto:300,500,700" rel="stylesheet">'
  req.dynamicHead += '<link rel="apple-touch-icon" sizes="180x180" href="/img/icon/apple-touch-icon.png">'
  req.dynamicHead += '<link rel="icon" type="image/png" sizes="32x32" href="/img/icon/favicon-32x32.png">'
  req.dynamicHead += '<link rel="icon" type="image/png" sizes="16x16" href="/img/icon/favicon-16x16.png">'
  req.dynamicHead += '<link rel="manifest" href="/img/icon/manifest.json">'
  req.dynamicHead += '<link rel="mask-icon" href="/img/icon/safari-pinned-tab.svg" color="#5bbad5">'
}

function parseUrl (url) {
  var match = url.match(/^(http|https|ftp)?(?:[:/]*)([a-z0-9.-]*)(?::([0-9]+))?(\/[^?#]*)?(?:\?([^#]*))?(?:#(.*))?$/i)
  var ret = {}

  ret['protocol'] = ''
  ret['host'] = match[2]
  ret['port'] = ''
  ret['path'] = ''
  ret['query'] = ''
  ret['fragment'] = ''

  if (match[1]) {
    ret['protocol'] = match[1]
  }

  if (match[3]) {
    ret['port'] = match[3]
  }

  if (match[4]) {
    ret['path'] = match[4]
  }

  if (match[5]) {
    ret['query'] = match[5]
  }

  if (match[6]) {
    ret['fragment'] = match[6]
  }

  return ret
}
export {setHead}
