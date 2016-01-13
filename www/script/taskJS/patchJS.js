;(function () {
	/**
	 * The module is designed to prove some functions which used for interaction 
	 * in a patch selection task.
	 */
	
	function PatchJS(options) {

		/** fetch the options */
		options = options || {}

		/** set the container of patch image */
		this.patchContainer = options.patchContainer || undefined

		/** set default container's id */
		this.defaultContainerSelector = options.defaultContainerSelector || "#patchImage"

		/** set the patch element */
		this.patchDOM = options.patchDOM || undefined

		/** set the element array to indicate the center of PMs */
		this.points = []

		/** set the selector of the undo operation element */
		this.undoSelector = options.undoSelector || '#oper-undo'

		/** set the selector of the redo operation element */
		this.redoSelector = options.redoSelector || '#oper-redo'

		/** set the selector of the reset operation element */
		this.resetSelector = options.resetSelector || '#oper-reset'

		/** set the selector of the done operation element */
		this.doneSelector = options.doneSelector || '#oper-done'

		/** set the selector of the skip operation element */
		this.skipSelector = options.skipSelector || '#oper-skip'

		/** set the max size of patch image */
		this.maxsize = options.maxsize || '500px'

		/** set the undo redo instance */
		this.undoredo = window.undoredo.init({
			undoButton: $(this.undoSelector),
			redoButton: $(this.redoSelector),
			resetButton: $(this.resetSelector),
			resetFunc: this.resetButtonFunc
		})

		return this
	}

	PatchJS.prototype.resetButtonFunc = function() {
		for (var i=0; i<window.particle.PatchJS.points.length; i++) {
			window.particle.PatchJS.points[i].remove()
		}
		window.particle.PatchJS.points = []
	}

	/**
	 * The function to handle the touch event happened on the region of patch image.
	 * It will fetch the x and y axis in the image's real size.
	 * @param  {Object} event The Event Object with JQuery.
	 *                        https://api.jquery.com/category/events/event-object/
	 *                        
	 * @return {[type]}       [description]
	 */
	PatchJS.prototype.onTouchStart = function(event) {
		event.preventDefault()
		var touches = event.originalEvent.targetTouches
		// console.log(touches)
		if (typeof window.particle.PatchJS.patchDOM == "undefined") {
			return
		}
		if (touches.length > 1) {
			// handle the situation that there are more than one touch on the screen
			// console.log('only one touch allowed. Left no response.')
			return 
		}
		window.particle.PatchJS.marker({
			target: $(event.target),
			clientX: touches[0].clientX,
			clientY: touches[0].clientY,
			eventType: "add"
		})
	}

	/**
	 * The function to handle the touch event happened on the region of patch image.
	 * It will fetch the x and y axis in the image's real size.
	 * @param  {Object} event The Event Object with JQuery.
	 *                        https://api.jquery.com/category/events/event-object/
	 *                        
	 * @return {[type]}       [description]
	 */
	PatchJS.prototype.onClickStart = function(event) {
		event.preventDefault()
		var click = event.originalEvent
		// console.log(click)
		if (typeof window.particle.PatchJS.patchDOM == "undefined") {
			return
		}
		if (click.buttons == 0) {
			/** the mouse not click down */
			return
		}
		window.particle.PatchJS.marker({
			target: $(event.target),
			clientX: click.clientX,
			clientY: click.clientY,
			eventType: "add"
		})
	}


	/**
	 * The function to handle the touch move event on the existing marker
	 * @param  {Object} event The Event Object with JQuery.
	 *                        https://api.jquery.com/category/events/event-object/
	 *                        
	 * @return {[type]}       [description]
	 */
	PatchJS.prototype.onTouchMove = function(event) {
		event.preventDefault()
		event.stopPropagation()
		var touches = event.originalEvent.targetTouches
		if (typeof window.particle.PatchJS.patchDOM == "undefined") {
			return
		}
		if (touches.length > 1) {
			// handle the situation that there are more than one touch on the screen
			// console.log('only one touch allowed. Left no response.')
			return
		}
		window.particle.PatchJS.marker({
			target: $(window.particle.PatchJS.patchDOM),
			marker: $(event.target).parent(),
			clientX: touches[0].clientX,
			clientY: touches[0].clientY,
			eventType: (event.type == "touchmove") ? "move": "movestart"
		})
	}

	/**
	 * The function to handle the touch event happened on the region of patch image.
	 * It will fetch the x and y axis in the image's real size.
	 * @param  {Object} event The Event Object with JQuery.
	 *                        https://api.jquery.com/category/events/event-object/
	 *                        
	 * @return {[type]}       [description]
	 */
	PatchJS.prototype.onClickMove = function(event) {
		event.preventDefault()
		event.stopPropagation()
		var click = event.originalEvent
		if (typeof window.particle.PatchJS.patchDOM == "undefined") {
			return
		}
		if (click.buttons == 0) {
			/** the mouse not click down */
			return
		}
		window.particle.PatchJS.marker({
			target: $(window.particle.PatchJS.patchDOM),
			marker: $(event.target).parent(),
			clientX: click.clientX,
			clientY: click.clientY,
			eventType: (event.type == "mousemove") ? "move": "movestart"
		})
	}

	/**
	 * The function to handle all event of the marker.
	 * @param  {Object} args The object of the touch or click event
	 *                       clientX: the X position of the touch or click
	 *                       clientY: the Y position of the touch or click
	 *                       target: the JQuery object of the target element
	 *                       marker: the JQuery object of the marker element
	 *                       eventType: indicate the type of event, 
	 *                       	"movestart": is the start of a movement
	 *                       	"move": is an update of the current position of marker
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
	PatchJS.prototype.marker = function(args) {
		var offset = args.target.offset()
		var displayx = args.clientX - offset.left
		var displayy = args.clientY - offset.top
		var displayHeight = 1.0 * args.target.height()
		var displayWidth = 1.0 * args.target.width()
		if (displayx < 0 || displayy < 0 || displayx > displayWidth || displayy > displayHeight) {
			return
		}

		/** based on the event type, set or update checkpoint */
		if (args.eventType == "movestart") {
			/** push the undo function into the array */
			window.particle.PatchJS.undoredo.pushUndo({
				recover: function(args) {
					args.marker.attr('data-real-x',args.realx).attr('data-real-y', args.realy)
					args.marker.css('left',args.left).css('top',args.top)
				},
				redo: window.particle.PatchJS.marker,
				args: {
					originalArgs: args,
					marker: args.marker,
					realx: args.marker.attr('data-real-x'),
					realy: args.marker.attr('data-real-y'),
					left: args.marker.css('left'),
					top: args.marker.css('top')
				},
				instance: window.particle.PatchJS.undoredo
			})
		}
		if (args.eventType == "move") {
			/** modify the previous pushed undo function */
			var originalArgs = args
			originalArgs.eventType = "movestart"
			window.particle.PatchJS.undoredo.replaceUndo({
				originalArgs: originalArgs,
				instance: window.particle.PatchJS.undoredo
			})
		}
		if (args.eventType == "add") {
			/** create a new point center element */
			args.marker = $(".pointCenter.hidden").clone(true)
			/** push the undo function into the array */
			window.particle.PatchJS.undoredo.pushUndo({
				recover: function(args) {
					args.marker.hide()
					var markerIndex = window.particle.PatchJS.points.indexOf(args.marker[0])
					window.particle.PatchJS.points.splice(markerIndex, 1)
				},
				redo: function(args) {
					args.marker.show()
					window.particle.PatchJS.points.push(args.marker[0])
					window.particle.PatchJS.undoredo.pushUndo(args.undoOptions)
				},
				args: {
					originalArgs: args,
					marker: args.marker,
					useAllArgs: true, // this will pass the recover and redo function with the whole args instead of originalArgs
					passOptions: true // this will pass the whole options Object of pushUndo into redo function.
				},
				instance: window.particle.PatchJS.undoredo
			})

			/** bind event to marker */
			args.marker.children('img').bind("touchstart touchmove", window.particle.PatchJS.onTouchMove)
			args.marker.children('img').bind("mousedown mousemove", window.particle.PatchJS.onClickMove)
			/** add new marker */
			$(".pointCenter.hidden").after(args.marker)
			/** display new marker */
			args.marker.removeClass('hidden')
			/** push into marker stack */
			window.particle.PatchJS.points.push(args.marker[0])
		}

		/** consider the rate of zoom, calculate the real size and position */
		var realHeight = 1.0 * args.target.attr("data-height")
		var realWidth = 1.0 * args.target.attr("data-width")
		var realx = Math.round(1.0 * displayx * realHeight / displayHeight)
		var realy = Math.round(1.0 * displayy * realWidth / displayWidth)
		// console.log("in display image size, x: %d, y: %d", displayx, displayy)
		// console.log("in real image size, x: %d, y: %d", realx, realy)

		/** modify the point center element */
		args.marker.attr('data-real-x',realx).attr('data-real-y', realy)
		args.marker.css('left',args.clientX).css('top',args.clientY)


	}

	/**
	 * The function to set the patch(image) element 
	 * @param {Object} obj A Image DOM which is the patch image
	 */
	PatchJS.prototype.setPatchDOM = function(obj) {
		if (this.patchDOM && this.patchDOM != obj) {
			this.patchDOM.remove()
		}
		this.patchDOM = obj
	}



	/**
	 * The function which can load the patch image from the parse.com server
	 * @param  {Object} options The options is a object which contains some essential 
	 *                          information for load the patch image
	 *                          dest: the JQuery Object of DOM, the container of the
	 *                          	image DOM
	 *                          patchURL: the url of the patch image in parse.com
	 *                          patchID: the id of the patch object in parse.com
	 *                          patchHeight: the real height of patch image
	 *                          patchWidth: the real width of patch image
	 * @return {[type]}         [description]
	 */
	PatchJS.prototype.loadPatch = function(options) {
		options = options || {}

		/** check the destination is set properly */
		if (!options.dest || options.dest.length == 0) {
			return
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
					$(this).css("max-width", window.particle.PatchJS.maxsize)
				} else {
					$(this).height("80vh")
					$(this).css("max-height", window.particle.PatchJS.maxsize)
				}
				/** bind some events */
				$(this).bind("touchstart", window.particle.PatchJS.onTouchStart)
				$(this).bind("mousedown", window.particle.PatchJS.onClickStart)

				/** fade In the image when loaded*/
				$(this).fadeIn()

				/** set the finish button event */
				$(window.particle.PatchJS.doneSelector).off('click').on('click', function() {
					window.particle.PatchJS.confirmFinish()
				})

				/** display the operations */
				// $("#confirm").addClass('floatdown').removeClass('floatup');
				$(".operations").removeClass('floatdown').addClass('floatup');

				/** set the skip button event */
				$(window.particle.PatchJS.skipSelector).off('click').on('click', function() {
					window.particle.PatchJS.skipTask()
				})

				/** set timeout to enable the done button enable */
				window.particle.PatchJS.skipButtonEnableTimer = setTimeout(function() {
					/** enable skip */
					$(window.particle.PatchJS.skipSelector).addClass('active')
				}, 5000)

				/** set timeout to enable the done button enable */
				window.particle.PatchJS.doneButtonEnableTimer = setTimeout(function() {
					$(window.particle.PatchJS.doneSelector).addClass('active')
				}, 1000)
			}
			/** disable finish */
			$(window.particle.PatchJS.doneSelector).removeClass('active')
			/** disable skip */
			$(window.particle.PatchJS.skipSelector).removeClass('active')
			/** reset the undo redo instance */
			window.particle.PatchJS.undoredo = window.undoredo.init({
				undoButton: $(window.particle.PatchJS.undoSelector),
				redoButton: $(window.particle.PatchJS.redoSelector),
				resetButton: $(window.particle.PatchJS.resetSelector),
				resetFunc: window.particle.PatchJS.resetButtonFunc
			})
			/** load the image from options.patchURL */
			imageDOM.src = options.patchURL
			/** update the current patch DOM in patchJS object */
			window.particle.PatchJS.setPatchDOM(imageDOM)
			/** hide the image */
			$(imageDOM).hide()
			/** set the image properties */
			$(imageDOM).attr("id", options.patchID)
			$(imageDOM).attr('data-height', options.patchHeight)
			$(imageDOM).attr('data-width', options.patchWidth)
			$(imageDOM).attr('data-frame-x', options.frameX)
			$(imageDOM).attr('data-frame-y', options.frameY)
			$(imageDOM).attr('data-frame-id', options.frameId)
			$(imageDOM).addClass('patch_image')
			/** add the image element into destination */
			options.dest.append($(imageDOM))
		}
	}

	/**
	 * The function to load the failure message. When the failure appears at server, display this message and give options to user
	 * @param  {Object} options The error object from server
	 * @return {[type]}         [description]
	 */
	PatchJS.prototype.loadFailureMessage = function(options) {
		options = options || {}
		console.log(options)
		$('#errorBox').addClass('active')
	}

	/**
	 * The function call the DataService function to get a "patch" task
	 * @param  {Object} options The options for this function
	 *                          Left for future usage
	 * @return {[type]}         [description]
	 */
	PatchJS.prototype.requestTask = function(options) {
		options = options || {}
		options.taskType = "patch"
		while (this.points.length > 0) {
			this.points.pop().remove()
		}
		options.dest = this.patchContainer || $(this.defaultContainerSelector)
		options.callback = this.loadPatch
		options.errorHandler = this.loadFailureMessage
		window.particle.DataService.getTask(options)
	}

	/**
	 * The function to skip current task and request a new task
	 * @return {[type]} [description]
	 */
	PatchJS.prototype.skipTask = function() {
		if (! $(window.particle.PatchJS.skipSelector).hasClass('active')) {
			return
		}
		if ($("#confirm").hasClass("floatup")) {
			$("#confirm").addClass('floatdown').removeClass('floatup');
		}
		if ($("#operations").hasClass("floatup")) {
			$("#operations").removeClass('floatup').addClass('floatdown');
		}
		$(window.particle.PatchJS.patchDOM).fadeOut()
		window.particle.PatchJS.requestTask()
	}

	/**
	 * The function that let the user can confirm when they click or touch the finish event
	 */
	PatchJS.prototype.confirmFinish = function() {
		if (! $(window.particle.PatchJS.doneSelector).hasClass('active')) {
			return
		}
		if (window.particle.PatchJS.points.length == 0) {
			$("#confirm-text").html('NO PARTICLE IN PATCH?')
		} else if (window.particle.PatchJS.points.length == 1) {
			$("#confirm-text").html('SUBMIT '+window.particle.PatchJS.points.length.toString()+' LABELED PARTICLE IN PATCH?')
		} else {
			$("#confirm-text").html('SUBMIT '+window.particle.PatchJS.points.length.toString()+' LABELED PARTICLES IN PATCH?')
		}
		$("#operations").removeClass('floatup').addClass('floatdown')
		$('#confirm').removeClass('floatdown').addClass('floatup')
		$('#confirm-cancel').off('click').on('click', function() {
			$("#confirm").removeClass('floatup').addClass('floatdown')
			$("#operations").removeClass('floatdown').addClass('floatup')
		})
		$('#confirm-ok').off('click').on('click', function() {
			window.particle.PatchJS.submitResult();
			$("#confirm").removeClass('floatup').addClass('floatdown')
			$('#operations').removeClass('floatdown')
		})
	}

	PatchJS.prototype.submitResult = function() {
		/** build the answer object */
		var patchid = $("#patchImage > img")[0].id
		var answer = {
			points: [],
			length: window.particle.PatchJS.points.length,
			patchid: patchid
		}
		var patchXAtFrame = parseInt($("#"+patchid).attr("data-frame-x"))
		var patchYAtFrame = parseInt($("#"+patchid).attr("data-frame-y"))
		for (var i=0; i<answer.length; i++) {
			answer.points.push({
				patchid: patchid,
				positionXAtFrame: patchXAtFrame + parseInt($(window.particle.PatchJS.points[i]).attr("data-real-x")),
				positionYAtFrame: patchYAtFrame + parseInt($(window.particle.PatchJS.points[i]).attr("data-real-y")),
				confidence: window.particle.user.confidence
			})
			$(window.particle.PatchJS.points[i]).fadeOut()
		}

		window.particle.DataService.answerTask({
			taskType: "patch",
			answer: answer,
			callback: function(options) {
				window.particle.PatchJS.requestTask()
			}
		})
		
		$(window.particle.PatchJS.patchDOM).fadeOut()
		/** disable operations */
		$(window.particle.PatchJS.skipSelector).removeClass('active')
		$("#operations").removeClass('floatup').addClass('floatdown')
	}

	
	/**
	 * The function to initialize the patchJS module
	 * @param  {Object} options 
	 * @return {Object}         The object of patchJS module.
	 */
	PatchJS.init = function(options) {
		return new PatchJS(options)
	}

	window.PatchJS = PatchJS

}());