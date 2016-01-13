;(function () {
	/**
	 * The module is designed to prove some functions which used for interaction 
	 * in a patch selection task.
	 */
	
	function ReviewPatchJS(options) {

		/** fetch the options */
		options = options || {}

		/** set the container of patch image */
		this.patchContainer = options.patchContainer || undefined

		/** set default container's id */
		this.defaultContainerSelector = options.defaultContainerSelector || "#reviewPatchImage"

		/** set the patch element */
		this.patchDOM = options.patchDOM || undefined

		/** set the element array to indicate the center of PMs */
		this.points = []

		/** set the object of current point the user are reviewing */
		this.currentPoint = {}

		/** set the marker */
		this.markerSelector = options.markerSelector || '#review-point'

		/** set the selector to view original patch */
		this.hideSelector = options.hideSelector || '#oper-hide'

		/** set the selector of the accept operation element */
		this.acceptSelector = options.acceptSelector || '#oper-accept'

		/** set the selector of the reject operation element */
		this.rejectSelector = options.rejectSelector || '#oper-reject'

		/** set the selector of the skip operation element */
		this.skipSelector = options.skipSelector || '#oper-skip'

		/** set the max size of patch image */
		this.maxsize = options.maxsize || '500px'

		return this
	}

	/**
	 * The function to display the labeled marker on the patch
	 * @param  {Object} args The object of the touch or click event
	 *                       clientX: the X position of the touch or click
	 *                       clientY: the Y position of the touch or click
	 *                       target: the JQuery object of the target element
	 *                       marker: the JQuery object of the marker element
	 *                       eventType: indicate the type of event, 
	 *                       	"add": is to add a new marker
	 * @return {[type]}      [description]
	 */
	/* The coordinate system.
	 * 
	 *  o ------------------------------- x
	 *  |     ________________________
	 *  |    |(x,y)                   |
	 *  |    |                        |
	 *  |    |                        |
	 *  |    |________________________|     
	 *  |                              (x+width, y+height)
	 *  |
	 *  y
	 */
	ReviewPatchJS.prototype.showNextMarker = function() {
		if (window.particle.ReviewPatchJS.points.length == 0) {
			/** in this situation, we need to load a new patch and associated points */
			if (window.particle.ReviewPatchJS.patchDOM) {
				$(window.particle.ReviewPatchJS.patchDOM).fadeOut()
			}
			$(this.markerSelector).addClass('hidden')
			/** disable the operations */
			$(".operations").removeClass('floatup').addClass('floatdown')
			window.particle.ReviewPatchJS.requestTask()
			return false
		}

		/** compute the location of the marker */
		window.particle.ReviewPatchJS.currentPoint = window.particle.ReviewPatchJS.points.pop()
		var point = window.particle.ReviewPatchJS.currentPoint
		var target = $(window.particle.ReviewPatchJS.patchDOM)
		var offset = target.offset()
		var realx = point.frameX - 1.0 * target.attr("data-frame-x")
		var realy = point.frameY - 1.0 * target.attr("data-frame-y")
		var displayHeight = 1.0 * target.height()
		var displayWidth = 1.0 * target.width()
		var realHeight = 1.0 * target.attr("data-height")
		var realWidth = 1.0 * target.attr("data-width")
		var displayx = 1.0 * realx * displayHeight / realHeight
		var displayy = 1.0 * realy * displayWidth / realWidth
		var clientX = Math.round(offset.left + displayx)
		var clientY = Math.round(offset.top + displayy)
		console.log(clientX)
		console.log(clientY)

		/** select a new point center element */
		var marker = $(window.particle.ReviewPatchJS.markerSelector)
		/** display new marker */
		marker.removeClass('hidden')
		$(".hide-hide").removeClass("hidden")
		$(".hide-show").addClass("hidden")
		/** modify the point center element */
		marker.attr('point-id', point.objectId)
		marker.attr('data-real-x',realx).attr('data-real-y', realy)
		marker.css('left',clientX).css('top',clientY)
		return true
	}

	/**
	 * The function to hide or show the current marker
	 */
	ReviewPatchJS.prototype.hideorshowmarker = function() {
		if ($(window.particle.ReviewPatchJS.markerSelector).hasClass("hidden")) {
			$(window.particle.ReviewPatchJS.markerSelector).removeClass("hidden")
			$(".hide-hide").removeClass("hidden")
			$(".hide-show").addClass("hidden")
		} else {
			$(window.particle.ReviewPatchJS.markerSelector).addClass("hidden")
			$(".hide-hide").addClass("hidden")
			$(".hide-show").removeClass("hidden")
		}
	}

	/**
	 * The function to set the patch(image) element 
	 * @param {Object} obj A Image DOM which is the patch image
	 */
	ReviewPatchJS.prototype.setPatchDOM = function(obj) {
		if (this.patchDOM && this.patchDOM != obj) {
			$(this.patchDOM).remove()
		}
		this.patchDOM = obj
	}



	/**
	 * The function which can load the patch image from the parse.com server and store the point objects
	 * @param  {Object} options The options is a object which contains some essential 
	 *                          information for load the patch image
	 *                          dest: the JQuery Object of DOM, the container of the
	 *                          	image DOM
	 *                          patchURL: the url of the patch image in parse.com
	 *                          patchID: the id of the patch object in parse.com
	 *                          patchHeight: the real height of patch image
	 *                          patchWidth: the real width of patch image
	 *                          points: the associated labeled particles in the patch
	 * @return {[type]}         [description]
	 */
	ReviewPatchJS.prototype.loadPatchAndPoints = function(options) {
		options = options || {}

		/** check the destination is set properly */
		if (!options.dest || options.dest.length == 0) {
			return
		}

		/** fetch the point objects in the patch */
		if (options.points.length > 0) {
			console.log(options.points)
			window.particle.ReviewPatchJS.points = options.points
		}

		/** fetch the image from parse.com server */
		if (options.patchURL) {
			var imageDOM = new Image()
			/** when the image file loaded, set some attributes, bind events and display */
			imageDOM.onload = function() {
				/** let the patch in the center, a Bootstrap class */
				$(this).addClass("center-block")
				/** set the size of image */
				if ($(window).height() > $(window).width()) {
					$(this).width("100vw")
					$(this).css("max-width", window.particle.ReviewPatchJS.maxsize)
				} else {
					$(this).height("80vh")
					$(this).css("max-height", window.particle.ReviewPatchJS.maxsize)
				}

				/** fade In the image when loaded*/
				$(this).fadeIn()

				$(window.particle.ReviewPatchJS.hideSelector).off('click').on('click', window.particle.ReviewPatchJS.hideorshowmarker)

				/** set the accept button event */
				$(window.particle.ReviewPatchJS.acceptSelector).off('click').on('click', function() {
					window.particle.ReviewPatchJS.answer({
						answerType: 'accept'
					})
				}).addClass('active')

				/** set the reject button event */
				$(window.particle.ReviewPatchJS.rejectSelector).off('click').on('click', function() {
					window.particle.ReviewPatchJS.answer({
						answerType: 'reject'
					})
				}).addClass('active')


				/** display the operations */
				$(".operations").removeClass('floatdown').addClass('floatup');

				/** set the skip button event */
				$(window.particle.ReviewPatchJS.skipSelector).off('click').on('click', function() {
					window.particle.ReviewPatchJS.answer({
						answerType: 'skip'
					})
				}).addClass('active')

				/** display the next point */
				window.particle.ReviewPatchJS.showNextMarker()
			}
			/** disable hide maker */
			$(window.particle.ReviewPatchJS.hideSelector).unbind("touchstart touchmove mousedown mousemove touchend touchcancel mouseup mouseout")
			/** disable accept */
			$(window.particle.ReviewPatchJS.acceptSelector).removeClass('active')
			/** disable reject */
			$(window.particle.ReviewPatchJS.rejectSelector).removeClass('active')
			/** disable skip */
			$(window.particle.ReviewPatchJS.skipSelector).removeClass('active')
			/** load the image from options.patchURL */
			imageDOM.src = options.patchURL
			/** update the current patch DOM in ReviewPatchJS object */
			window.particle.ReviewPatchJS.setPatchDOM(imageDOM)
			/** hide the image */
			$(imageDOM).hide()
			/** set the image properties */
			$(imageDOM).attr('id', options.patchID)
			$(imageDOM).attr('data-height', options.patchHeight)
			$(imageDOM).attr('data-width', options.patchWidth)
			$(imageDOM).attr('data-frame-x', options.frameX)
			$(imageDOM).attr('data-frame-y', options.frameY)
			$(imageDOM).attr('data-frame-id', options.frameId)
			$(imageDOM).addClass('patch_image')
			/** add the image element into destination container */
			options.dest.append($(imageDOM))
		}
	}

	/**
	 * The function to load the failure message. When the failure appears at server, display this message and give options to user
	 * @param  {Object} options The error object from server
	 * @return {[type]}         [description]
	 */
	ReviewPatchJS.prototype.loadFailureMessage = function(options) {
		options = options || {}
		console.log(options)
		$('#errorBox').addClass('active')
	}

	/**
	 * The function call the DataService function to get a "review-patch" task
	 * @param  {Object} options The options for this function
	 *                          Left for future usage
	 * @return {[type]}         [description]
	 */
	ReviewPatchJS.prototype.requestTask = function(options) {
		options = options || {}
		options.taskType = "review-patch"
		this.points = []
		options.dest = this.patchContainer || $(this.defaultContainerSelector)
		options.callback = this.loadPatchAndPoints
		options.errorHandler = this.loadFailureMessage
		window.particle.DataService.getTask(options)
	}

	/**
	 * The function to answer the task. It can 'accept', 'reject' or 'skip' the current review question
	 * @param {Object} obj 	The object for the answer,
	 *                      answerType: the type of answer. It could be 'accept', 'reject' or 'skip'
	 * @return {[type]} [description]
	 */
	ReviewPatchJS.prototype.answer = function(obj) {
		if (obj.answerType == 'skip') {
			this.showNextMarker()
			return true
		}
		var answer = {
			pointid: window.particle.ReviewPatchJS.currentPoint.objectId,
			confidenceAtCreated: window.particle.user.confidence
		}
		if (obj.answerType == 'accept') {
			answer.decision = true
		}
		if (obj.answerType == 'reject') {
			answer.decision = false
		}
		window.particle.DataService.answerTask({
			taskType: "review-patch",
			answer: answer,
			callback: function(options) {
				window.particle.ReviewPatchJS.showNextMarker()
			}
		})
	}
	
	/**
	 * The function to initialize the reviewPatchJS module
	 * @param  {Object} options 
	 * @return {Object}         The object of reviewPatchJS module.
	 */
	ReviewPatchJS.init = function(options) {
		return new ReviewPatchJS(options)
	}

	window.ReviewPatchJS = ReviewPatchJS

}());