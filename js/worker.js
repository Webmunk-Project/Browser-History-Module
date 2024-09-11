/* global chrome, registerCustomModule, registerMessageHandler */

(function () {
  let moduleConfig = {}

  const fetchHistory = function (request, sender, sendResponse) {
    chrome.storage.local.get({ 'browser-history-last-fetch': 0 }, function (result) {
      let lastFetch = result['browser-history-last-fetch']

      if (request.fetchSince !== undefined) {
        lastFetch = request.fetchSince
      }

      let sinceAgo = moduleConfig['browser-history-since-ago']

      console.log(`[Browser History] Fetch up to ${sinceAgo} days ago. Last: ${lastFetch}`)
      // console.log(result)

      const now = Date.now()

      if (lastFetch === 0) {
        if (sinceAgo === undefined || sinceAgo === null) {
          sinceAgo = (1000 * 60 * 60 * 24 * 180) // 180 days
        } else {
          sinceAgo = (1000 * 60 * 60 * 24 * sinceAgo)
        }

        lastFetch = now - sinceAgo
      }

      chrome.storage.local.set({
        'browser-history-last-fetch': now
      }, function (result) {
        chrome.history.search({
          startTime: lastFetch,
          text: '',
          maxResults: 1024
        }, function (historyItems) {
          const results = []

          historyItems.forEach(function (historyItem) {
            chrome.history.getVisits({
              url: historyItem.url
            }, function (visits) {
              // TODO: Filter > lastFetch

              visits.forEach(function (visit) {
                if (visit.visitTime > lastFetch) {
                  console.log(visit)

                  const visitLogItem = {
                    visit,
                    url: historyItem.url,
                    historyItem,
                    id: visit.visitId,
                    referrer_id: visit.referringVisitId
                  }
  
                  results.push(visitLogItem)
                } else {
                  console.log('SKIP')
                }
              })

              if (historyItem === historyItems[historyItems.length - 1]) {
                console.log(`[Browser History]: ${results.length} items retrieved.`)

                sendResponse(results)
              }
            })
          })
        })
      })
    })

    return false
  }

  registerCustomModule(function (config) {
    if (config === null) {
      return
    }
    
    moduleConfig = config['browser-history']

    if (moduleConfig === null || moduleConfig === undefined) {
      moduleConfig = {}
    }

    registerMessageHandler('fetch_browser_history', fetchHistory)

    console.log('[Browser History] Initialized.')
    // console.log(config)
  })
})()
