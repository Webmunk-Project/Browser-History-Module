/* global chrome, registerCustomModule, registerMessageHandler */

(function () {
  const fetchHistory = function (request, sender, sendResponse) {
    chrome.storage.local.get({ 'browser-history-last-fetch': 0 }, function (result) {
      let lastFetch = result['browser-history-last-fetch']

      if (request.fetchSince !== undefined) {
        lastFetch = request.fetchSince
      }

      const now = Date.now()

      const monthAgo = now - (1000 * 60 * 60 * 24 * 30)

      if (lastFetch < monthAgo) {
        lastFetch = monthAgo
      }

      console.log(`[Browser History]: Fetch ${lastFetch}...`)

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
              visits.forEach(function (visit) {
                const visitLogItem = {
                  visit,
                  url: historyItem.url,
                  historyItem,
                  id: visit.visitId,
                  referrer_id: visit.referringVisitId
                }

                results.push(visitLogItem)
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
    if (config === null || config === undefined) {
      config = {}
    }

    registerMessageHandler('fetch_browser_history', fetchHistory)

    console.log('[Browser History] Initialized.')
  })
})()
