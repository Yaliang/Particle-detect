var getTaskPatch = function(request, response) {
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

var findSuperPoint = function(point, response, o) {
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
								message: 'All answer are saved. At least one new Super Point is added.'
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
								message: 'All answer are saved. At least one Super Point is updated.'
							})
						}
					})
				})
			})
		}
	})
}

var insertPoint = function(request, response) {
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

module.exports.getTaskPatch = getTaskPatch

module.exports.insertPoint = insertPoint

module.exports.findSuperPoint = findSuperPoint

