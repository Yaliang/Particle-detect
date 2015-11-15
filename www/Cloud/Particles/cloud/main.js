
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
				code: '405',
				message: 'The current stage cannot match any stage defined in cloud'
			})
	}
})

function getTaskPatch(request, response) {
	var resObj = {}
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
}

Parse.Cloud.define('getTask', function(request, response) {
	var options = {
		taskType: request.params.taskType
	}
	// if (!request.user) {
	// 	response.error({
	// 		code: '408',
	// 		message: 'No user logged-in.'
	// 	})
	// }
	switch(options.taskType) {
		case 'patch':
			getTaskPatch(request, response)
			break
		default:
			response.error({
				code: '406',
				message: 'The required task cannot match any type of task defined in cloud.'
			})
	}
})

function answerTaskPatch(request, response) {
	/**
	 * answer object which include the 
	 * @type {Object}
	 */
	var answer = JSON.parse(request.params.answer)
	var Points = Parse.Object.extend("Point")

	/** create a patch */
	var Patches = Parse.Object.extend("Patch")
	var patch = new Patches()

	/** set ACL */
	var acl = new Parse.ACL()
	acl.setPublicReadAccess(true)
	acl.setWriteAccess(request.user.id, true)

	/** save all point in the answer set */
	for (var i=0; i<answer.length; i++) {
		/** set the patch */
		patch.id = answer.points[i].patchid

		/** save a new point */
		var point = new Points()
		point.set('user', request.user)
		point.setACL(acl)
		point.set('patch', patch)
		point.set('positionXAtFrame', answer.points[i].positionXAtFrame)
		point.set('positionYAtFrame', answer.points[i].positionYAtFrame)
		point.set('confidenceAtCreated', answer.points[i].confidence)
		point.set('confidence', answer.points[i].confidence)
		point.set('reviewNumber', 0)
		point.save(null)
	}

	/** response success */
	response.success({
		code: '200',
		message: 'All answer are saved.'
	})
	
}

Parse.Cloud.define('answerTask', function(request, response) {
	// Parse.Cloud.useMasterKey();
	var options = {
		taskType: request.params.taskType
	}
	if (!request.user) {
		response.error({
			code: '408',
			message: 'No user logged-in.'
		})
	}
	switch(options.taskType) {
		case 'patch':
			answerTaskPatch(request, response)
			break
		default:
			response.error({
				code: '407',
				message: 'The answer cannot match any type of task defined in cloud.'
			})
	}
})