var getTaskReviewPatch = function(request, response) {
	var resObj = {}
	/** fetch a patch task. Response with the object as a taskObj */
	var Points = Parse.Object.extend("Point")
	var Patches = Parse.Object.extend("Patch")
	var query = new Parse.Query(Points)
	query.ascending("reviewNumber")
	query.notEqualTo("user", request.user)

	query.first().then(function(point) {
		resObj.points = []
		resObj.originalPoints = []
		try {
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
		} catch(err) {
			response.error(err)
		}
	}, function(error) {
		response.error(error)
	})
}

var insertPointReview = function(request, response) {
	Parse.Cloud.useMasterKey();
	// store the review object first
	var answer = JSON.parse(request.params.answer)
	var Reviews = Parse.Object.extend("Review")
	var Points = Parse.Object.extend("Point")

	/** build the point that the review point to */
	var point = new Points()
	point.id = answer.pointid

	/** set ACL */
	var acl = new Parse.ACL()
	acl.setPublicReadAccess(true)
	acl.setWriteAccess(request.user.id, true)

	/** build a new review instance */
	var review = new Reviews()
	review.setACL(acl)
	review.set('user', request.user)
	review.set('type', 'point')
	review.set('point', point)
	review.set('decision', answer.decision)
	review.set('confidenceAtCreated', answer.confidenceAtCreated)
	review.save().then(function(review){
		var query = new Parse.Query(Points)
		query.get(point.id).then(function(point){
			var curtReviewNums = point.get('reviewNumber')
			var curtConfidence = point.get('confidence')
			var newDecision = 0.5
			var newDecisionConfidence = answer.confidenceAtCreated
			if (answer.decision == false) {
				newDecision = -0.5
			}
			/** calculate the new confidence */
			var newConfidence = (1.0 * (curtReviewNums + 1) * curtConfidence + (0.5 + newDecision * newDecisionConfidence)) / (curtReviewNums + 2)
			/** update the confidence value */
			point.set('confidence', newConfidence)
			/** update the review number */
			point.increment('reviewNumber', 1)
			point.save().then(function(point) {
				response.success({
					code: 200,
					message: 'new review is saved and the confidence of point is updated.'
				})
			}, function(error){
				response.error(error)
			})
		}, function(error) {
			response.error(error)
		})
	}, function(error) {
		response.error(error)
	})
}

module.exports.insertPointReview = insertPointReview

module.exports.getTaskReviewPatch = getTaskReviewPatch