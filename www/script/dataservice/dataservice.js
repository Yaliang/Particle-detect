;(function () {
	/**
	 * The module is design to prove the simple API for the communication with 
	 * 	our parse server. The API is packed into an object called DataService.
	 */
	
	function DataService(options) {

		/** fetch the options */
		options = options || {}

		/** parse.com app id */
		this.appid = options.appid || "7JSMjdDlgmtsWgGY5LOPMm3tCluhAo7Wmuu9MLpf"

		/** parse.com app js key */
		this.appkey = options.appkey || "75P9wy6X6guG9HRUvMxcVueLjZ93ljY56z3jrgAN"

		/** initialize parse.com */
		this.parse = Parse
		this.parse.initialize(this.appid, this.appkey)

		/** set the user account */
		this.user = options.user || undefined

		return this
	}

	/**
	 * function to register a new user even without specific username and password
	 * @param  {object} options The object for options
	 * @return {[type]}         [description]
	 */
	DataService.prototype.register = function(options) {
		var user = new this.parse.User()

		options = options || {}
		options.username = options.username || Math.random().toString()
		options.password = options.password || Math.random().toString()

		user.set("username", options.username)
		user.set("password", options.password)

		user.signUp(null, {
			success: function(user) {
				localStorage.username = options.username
				localStorage.password = options.password
				if (options.callback) {
					options.callback()
				}
			},
			error: function(user, error) {
				if (options.errorHandler) {
					options.errorHandler(user, error)
				}
			}
		})
	} 

	/**
	 * function to login the server even without specific the username
	 * and password. It fetch the stored value in localStorage to test
	 * the user login.
	 * @param  {Object} options The options which contain the specific
	 *                          username, password
	 *                          callback: the callback function when 
	 *                          success
	 *                          errorHandler: the callback function
	 *                          when an error happen.
	 * @return {[type]}         [description]
	 */
	DataService.prototype.login = function(options) {
		options =  options || {}

		/** if the username and password is not specified
		 * 		then attempt to fetch the record value in localStorage
		 */
		options.username = options.username || localStorage.username
		options.password = options.password || localStorage.password

		/** run the LogIn function to get the session of current user */
		this.parse.User.logIn(options.username, options.password, {
			success: function(user) {
				if (options.callback) {
					options.callback()
				}
			},
			error: function(user, error) {
				if (options.errorHandler) {
					otpions.errorHandler(user, error)
				}
			}
		})
	}

	/**
	 * the function to get the tutorial.
	 * 	The simple tasks are introduce here and the user's behaviors are scored
	 * 	as their initial confidence.
	 * @param  {Object} options The object to associate the current stage of tutorial
	 *                          stage: the number of the current stage
	 *                          behaviors: the array of the positions that touches 
	 *                          	user interacted on the screen
	 *                          callback: the function to continues display the 
	 *                          	next stage
	 * @return {[type]}         [description]
	 */
	DataService.prototype.getTutorial = function(options) {
		options = options || {}
		/** if the current stage is not declare, then stop the function */
		if (! options.stage) {
			return
		}

		/** if there is no behaviors, then set to empty array */
		options.behaviors = options.behaviors || []

		/** run the getTutorial Cloud Function to 
		 *		record the current stage behaviors,
		 *		fetch the next stage
		 */
		this.parse.Cloud.run('getTutorial', {
			stage: options.stage,
			behaviors: JSON.stringify(options.behaviors)
		}, {
			success: function(nextStage) {
				if (options.callback) {
					options.callback(nextStage)
				}
			},
			error: function(error) {
				if (options.errorHandler) {
					options.errorHandler(error)
				}
			}
		})
	}

	/**
	 * The function to request the server to assign a task to 
	 * 		current user. The user client must specify the 
	 * 		taskType it want to receive. The taskType must be
	 * 		one of the predefined task. We will make a list
	 * 		in the DataService module in future.
	 * @param  {Object} options The object that defined the options includes:
	 *                          taskType: one of the predefined
	 *                          	type that the server can assign
	 *                          	to a user to finish
	 *                          callback: the function to process the 
	 *                          	fetched task and present to user
	 *                          errorHandler: the function to display the error
	 *                          	information
	 * @return {[type]}         [description]
	 */
	DataService.prototype.getTask = function(options) {
		options = options || {}
		if (! options.taskType) {
			return
		}

		/** run the getTask Cloud Function to fetch a new task
		 * 		the taskType must be specified.
		 * 		When success, the function will return a new
		 * 			taskObj
		 * 		which includes everything need to build a new screen to 
		 * 			present the task
		 * 		if the request is rejected or inner error happen,
		 * 			the errorHandler will handle the error information
		 */
		this.parse.Cloud.run('getTask', {
			taskType: options.taskType
		}, {
			success: function(taskObj) {
				if (options.callback) {
					options.callback(taskObj)
				}
			},
			error: function(error) {
				if (options.errorHandler) {
					options.errorHandler(error)
				}
			}
		})
	}

	/**
	 * The function to answer a previous fetched task
	 * @param  {Object} options The options
	 *                          taskType: indicates the type of task it's answering
	 *                          answer: the content for the answer
	 *                          userid: the user id of current user. It can be left undefined,
	 *                          	if it's not defined, then the id will be fetched from Parse API,
	 *                          callback: the callback function when the state of current answer returned
	 *                          errorHandler: the handler of the error message. It has response to 
	 *                          	present error information to user.
	 * @return {[type]}         [description]
	 */
	DataService.prototype.answerTask = function(options) {
		options = options || {}
		if (! options.taskType) {
			return
		}

		/** fetch the current user id if the options not specify that */
		options.userId = options.userId || this.parse.User.current().id

		/** run the answerTask Cloud Function to insert a new answer
		 * 		The answer could be a review or a new insert record for a specific task
		 * 		The userid is used to identify who submitted this answer.
		 * 	When the feedback is accepted, a state object will returned
		 * 		the callback function will present the answer record to user
		 * 	When a error arises, the errorHandler will present it to user
		 */
		this.parse.Cloud.run('answerTask', {
			taskType: options.taskType,
			answer: JSON.stringify(options.answer),
			userid: options.userId 
		}, {
			success: function(state) {
				if (options.callback) {
					options.callback(state)
				}
			},
			error: function(error) {
				if (options.errorHandler) {
					options.errorHandler(error)
				}
			}
		})
	}

	/**
	 * The function to initialize the DataService module
	 * @param  {Object} options The object includes the parameters to initialize the 
	 *                          DataService module.
	 *                          All keys' values could be left as undefined. Then the 
	 *                          	default value could be assigned to the options 
	 *                          	object. Normally, empty options is fine. I just 
	 *                          	left it for future extension.
	 * @return {Object}         The object of DataService module.
	 */
	DataService.init = function(options) {
		return new DataService(options)
	}

	window.DataService = DataService

}());