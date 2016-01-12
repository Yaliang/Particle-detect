
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
		var randomSkipNumber=Math.floor(Math.random()*count*0.3)
		var query = new Parse.Query(Patches)
		query.skip(randomSkipNumber)
		query.limit(1)
		query.ascending("presentTime")

		query.find().then(function(patchesObj) {
			var selectedPatch = patchesObj[0]
			/** update the present time */
			// selectedPatch.increment("presentTime",1)
			// selectedPatch.save(null)
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

function getTaskReviewPatch(request, response) {
	var resObj = {}
	/** fetch a patch task. Response with the object as a taskObj */
	var Points = Parse.Object.extend("Point")
	var Patches = Parse.Object.extend("Patch")
	var query = new Parse.Query(Points)
	query.ascending("reviewNumber")

	query.first().then(function(point) {
		resObj.points = []
		resObj.originalPoints = []
		/** find the patch */
		var patchObj = new Patches()
		patchObj.id = point.get("patch").id
		patchObj.fetch().then(function(selectedPatch) {
			resObj.patchURL = selectedPatch.get("image").url()
			resObj.patchID = selectedPatch.id
			resObj.patchHeight = selectedPatch.get("sizeHeight")
			resObj.patchWidth = selectedPatch.get("sizeWidth")
			resObj.frameX = selectedPatch.get("positionXAtFrame")
			resObj.frameY = selectedPatch.get("positionYAtFrame")
			resObj.frameId = selectedPatch.get("frame").id
			resObj.originalPatch = selectedPatch
			/** find more points in same patch */
			var query = new Parse.Query(Points)
			query.equalTo("patch", patchObj)
			query.limit(5)
			query.ascending("reviewNumber")

			query.find().then(function(selectedPoints){
				resObj.originalPoints = selectedPoints
				for (var i = 0; i < selectedPoints.length; i++) {
					resObj.points.push({
						objectId: selectedPoints[i].id,
						frameX: selectedPoints[i].get("positionXAtFrame"),
						frameY: selectedPoints[i].get("positionYAtFrame")
					})
				}
				response.success(resObj)
			}, function(error) {
				response.error(error)
			})
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
		case 'review-patch':
			getTaskReviewPatch(request, response)
			break
		default:
			response.error({
				code: '406',
				message: 'The required task cannot match any type of task defined in cloud.'
			})
	}
})

function findSuperPoint(point, response, o) {
	Parse.Cloud.useMasterKey();

	var baseTolerance = 4
	var SuperPoint = Parse.Object.extend('SuperPoint')
	var query = new Parse.Query(SuperPoint)
	var p_x = point.get('positionXAtFrame')
	var p_y = point.get('positionYAtFrame')

	/** set ACL */
	var acl_readonly = new Parse.ACL()
	acl_readonly.setPublicReadAccess(true)

	/** find the super points in the base tolerance range */
	query.greaterThan("meanPositionXAtFrame", p_x - baseTolerance)
	query.lessThan("meanPositionXAtFrame", p_x + baseTolerance)
	query.greaterThan("meanPositionYAtFrame", p_y - baseTolerance)
	query.lessThan("meanPositionYAtFrame", p_y + baseTolerance)

	query.find().then(function(superPoints){
		if (superPoints.length == 0) {
			// create a new super point when no super point exist
			var newSP = new SuperPoint()
			newSP.set("meanPositionXAtFrame", p_x)
			newSP.set("meanPositionYAtFrame", p_y)
			newSP.setACL(acl_readonly)
			var point_patch = point.get('patch')
			point_patch.fetch().then(function(patch) {
				newSP.set('frame', patch.get('frame'))
				newSP.save().then(function(sp) {
					point.set('superPoint', sp)
					point.save().then(function(){
						o.unfinished -= 1
						if (o.unfinished <= 0) {
							/** response success */
							response.success({
								code: '200',
								message: 'All answer are saved. A new Super Point is built.'
							})
						}
					})
				})
			})
			
		} else {
			// find the best match
			var closest = 0
			var minDis = 1000000
			for (var i=0; i<superPoints.length; i++) {
				var nowSP = superPoints[i]
				var nowSP_x = nowSP.get('meanPositionXAtFrame')
				var nowSP_y = nowSP.get('meanPositionYAtFrame')
				var dis = Math.sqrt((nowSP_x - p_x) * (nowSP_x - p_x) + (nowSP_y - p_y) * (nowSP_y - p_y))
				if (dis < minDis) {
					closest = i
					minDis = dis
				}
			}
			// store and update
			point.set('superPoint', superPoints[closest])
			point.save().then(function(point) {
				var Point = Parse.Object.extend("Point")
				var newquery = new Parse.Query(Point)

				newquery.equalTo('superPoint', superPoints[closest])

				newquery.find().then(function(points) {
					var sum_x = 0.0
					var sum_y = 0.0
					for (var j = 0; j < points.length; j++) {
						sum_x += points[j].get('positionXAtFrame')
						sum_y += points[j].get('positionYAtFrame')
					}
					superPoints[closest].set('meanPositionXAtFrame', sum_x / points.length)
					superPoints[closest].set('meanPositionYAtFrame', sum_y / points.length)
					superPoints[closest].save().then(function(){
						o.unfinished -= 1
						if (o.unfinished <= 0) {
							/** response success */
							response.success({
								code: '200',
								message: 'All answer are saved. A new Super Point is built.'
							})
						}
					})
				})
			})
		}
	})
}

function insertPoint(request, response) {
	/**
	 * answer object:
	 * 			length: the number of point what to submit
	 * 			points: the array of points:
	 * 				patchid: the id where the user labeled
	 * 				positionXAtFrame: the position of x in frame
	 * 				positionYAtFrame: the position of y in frame
	 * 				confidence: the confidence of the label
	 * 				
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

	/** set a options to indicate how many points left */
	var o = {
		unfinished: answer.length
	}

	/** set a unit set to indicate which patches has increased present time */
	var u = {}

	/** save all point in the answer set */
	for (var i=0; i<answer.length; i++) {
		/** set the patch */
		patch.id = answer.points[i].patchid
		/** increase present time */
		if (!(patch.id in u)) {
			u[patch.id] = true
			var query = new Parse.Query(Patches)
			query.get(patch.id).then(function(patchObj){
				patchObj.increment("presentTime", 1)
				patchObj.save(null)
			})
		}

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
		point.save().then(function(point) {
			// find the super point
			try {
				findSuperPoint(point, response, o)
			}
			catch(err) {
				/** response success */
				response.success({
					code: '200',
					message: 'All answer are saved. But has internal error when finding super point',
					error: JSON.stringify(err)
				})
			}
		}, function(error) {
			response.error(error)
		})
	}

	/** increase no particle */
	if (answer.length == 0) {
		var query = new Parse.Query(Patches)
		query.get(answer.patchid, {
			success: function(patchObj) {
				console.log('fetch success')
				patchObj.increment("presentTime", 1)
				patchObj.increment('noLabelTime', 1)
				patchObj.save().then(function(){
					/** response success */
					response.success({
						code: '200',
						message: 'All answer are saved.'
					})
				}, function(error) {
					response.error(error)
				})
			}
		})
	}
}

function insertPointReview(request, response) {
	Parse.Cloud.useMasterKey();
	response.success({
		code: 200,
		message: 'blank function'
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
			insertPoint(request, response)
			break
		case 'review-patch':
			insertPointReview(request, response)
			break
		default:
			response.error({
				code: '407',
				message: 'The answer cannot match any type of task defined in cloud.'
			})
	}
})

Parse.Cloud.define('updatePointsWithoutSuperPoint', function(request, response) {
	var Point = Parse.Object.extend("Point")
	var query = new Parse.Query(Point)
	query.doesNotExist('superPoint')
	query.first().then(function(point) {
		if (point) {
			// it exists
			findSuperPoint(point, response)
		} else {
			// no unassigned point exists
			response.error({
				code: '406',
				message: 'No such point exists.'
			})
		}
	})
})