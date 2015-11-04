
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

require('cloud/app.js')
