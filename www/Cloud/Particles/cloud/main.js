
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
	response.success("Hello world!");
});

Parse.Cloud.define('getTutorial', function(request, response) {
	var options = {
		stage: request.params.stage,
		behaviors: JSON.parse(request.params.behaviors)
	}
	var resObj = {}
	switch(options.stage) {
		case 0:
			/** the initial stage. User has no interaction with system. */
			resObj.stage = 1
			resObj.pageFullPath = "./pages/welcome.html"
			resObj.pageid = "welcome"
			response.success(resObj)
			break
		case 1:
			/** the start stage. Introduce the project */
			resObj.stage = 2
			resObj.pageFullPath = "./pages/tutorial_start.html"
			resObj.pageid = "tutorial_start"
			response.success(resObj)
			break
		default:
			response.error({
				code: '404',
				message: 'The current stage cannot match any stage defined in cloud'
			})
	}
})

Parse.Cloud.define('getTask', function(request, response) {
	var options = {
		taskType: request.params.taskType
	}
	var resObj = {}
	switch(options.taskType) {
		case 'patch':
			/** fetch a patch task. Response with the object as a taskObj */
			var Patches = Parse.Object.extend("Patch")
			var query = new Parse.Query(Patches)
			query.count().then(function(count) {
				/** skip random number of patches and select one */
				var randomSkipNumber=Math.floor(Math.random()*count)
				var query = new Parse.Query(Patches)
				query.skip(randomSkipNumber)
				query.limit(1)
				query.ascending("createdAt")

				query.find().then(function(patchesObj) {
					var selectedPatch = patchesObj[0]
					/** format the response object with the required properties */
					resObj.patchURL = selectedPatch.get("image").url()
					resObj.patchID = selectedPatch.id
					resObj.patchHeight = selectedPatch.get("sizeHeight")
					resObj.patchWidth = selectedPatch.get("sizeWidth")
					resObj.frameX = selectedPatch.get("positionXAtFrame")
					resObj.frameY = selectedPatch.get("positionYAtFrame")
					resObj.frameId = selectedPatch.get("frame").id
					/** add the original object for future usage */
					resObj.originalObj = selectedPatch
					response.success(resObj)
				}, function(error) {
					response.error(error)
				})
			}, function(error) {
				response.error(error)
			})
			break
		default:
			response.error({
				code: '404',
				message: 'The required task cannot match any type defined in cloud'
			})
	}
})
