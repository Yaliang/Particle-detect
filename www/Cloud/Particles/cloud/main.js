funcs = require('cloud/funcs.js')

module = {
	point : require('cloud/point.js'),
	review : require('cloud/review.js'),
}

// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
	//response.success("Hello world!");
	response.success(funcs.hello())
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

Parse.Cloud.define('getTask', function(request, response) {
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
			module.point.getTaskPatch(request, response)
			break
		case 'review-patch':
			module.review.getTaskReviewPatch(request, response)
			break
		default:
			response.error({
				code: '406',
				message: 'The required task cannot match any type of task defined in cloud.'
			})
	}
})

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
			module.point.insertPoint(request, response)
			break
		case 'review-patch':
			module.review.insertPointReview(request, response)
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
			module.point.findSuperPoint(point, response)
		} else {
			// no unassigned point exists
			response.error({
				code: '406',
				message: 'No such point exists.'
			})
		}
	})
})