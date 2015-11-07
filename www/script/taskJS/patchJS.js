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

		/** set the undo redo instance */
		this.undoredo = undoredo.init()

		return this
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
		window.particle.PatchJS.markStart({
			target: $(event.target),
			clientX: touches[0].clientX,
			clientY: touches[0].clientY
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
			return
		}
		window.particle.PatchJS.markStart({
			target: $(event.target),
			clientX: click.clientX,
			clientY: click.clientY
		})
	}

	/**
	 * The function to handle the touch move event on the existing marker
	 * @param  {Object} event The Event Object with JQuery.
	 *                        https://api.jquery.com/category/events/event-object/
	 *                        
	 * @return {[type]}       [description]
	 */
	PatchJS.prototype.onTouchMoveStart = function(event) {
		event.preventDefault()
		event.stopPropagation()
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
		var clientX = touches[0].clientX
		var clientY = touches[0].clientY

		var args = {
			target: $(window.particle.PatchJS.patchDOM),
			marker: $(event.target).parent(),
			clientX: clientX,
			clientY: clientY
		}

		var offset = args.target.offset()
		var displayx = args.clientX - offset.left
		var displayy = args.clientY - offset.top
		var displayHeight = 1.0 * args.target.height()
		var displayWidth = 1.0 * args.target.width()
		if (displayx < 0 || displayy < 0 || displayx > displayWidth || displayy > displayHeight) {
			return
		}

		/** push the undo function into the array */
		window.particle.PatchJS.undoredo.pushUndo({
			recover: function(args) {
				args.marker.attr('data-real-x',args.realx).attr('data-real-y', args.realy)
				args.marker.css('left',args.left).css('top',args.top)
			},
			redo: window.particle.PatchJS.onTouchMoveStart,
			args: {
				originalArgs: event,
				marker: args.marker,
				realx: args.marker.attr('data-real-x'),
				realy: args.marker.attr('data-real-y'),
				left: args.marker.css('left'),
				top: args.marker.css('top')
			},
			instance: window.particle.PatchJS.undoredo
		})

		window.particle.PatchJS.markerMove(args)
	}

	/**
	 * The function to handle the touch event happened on the region of patch image.
	 * It will fetch the x and y axis in the image's real size.
	 * @param  {Object} event The Event Object with JQuery.
	 *                        https://api.jquery.com/category/events/event-object/
	 *                        
	 * @return {[type]}       [description]
	 */
	PatchJS.prototype.onClickMoveStart = function(event) {
		// console.log(event)
		event.preventDefault()
		event.stopPropagation()
		var click = event.originalEvent
		// console.log(click)
		if (typeof window.particle.PatchJS.patchDOM == "undefined") {
			return
		}
		if (click.buttons == 0) {
			return
		}
		var clientX = click.clientX
		var clientY = click.clientY

		var args = {
			target: $(window.particle.PatchJS.patchDOM),
			marker: $(event.target).parent(),
			clientX: clientX,
			clientY: clientY
		}

		var offset = args.target.offset()
		var displayx = args.clientX - offset.left
		var displayy = args.clientY - offset.top
		var displayHeight = 1.0 * args.target.height()
		var displayWidth = 1.0 * args.target.width()
		if (displayx < 0 || displayy < 0 || displayx > displayWidth || displayy > displayHeight) {
			return
		}

		/** push the undo function into the array */
		window.particle.PatchJS.undoredo.pushUndo({
			recover: function(args) {
				args.marker.attr('data-real-x',args.realx).attr('data-real-y', args.realy)
				args.marker.css('left',args.left).css('top',args.top)
			},
			redo: window.particle.PatchJS.onClickMoveStart,
			args: {
				originalArgs: event,
				marker: args.marker,
				realx: args.marker.attr('data-real-x'),
				realy: args.marker.attr('data-real-y'),
				left: args.marker.css('left'),
				top: args.marker.css('top')
			},
			instance: window.particle.PatchJS.undoredo
		})

		window.particle.PatchJS.markerMove(args)
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
		// console.log(touches)
		if (typeof window.particle.PatchJS.patchDOM == "undefined") {
			return
		}
		if (touches.length > 1) {
			// handle the situation that there are more than one touch on the screen
			// console.log('only one touch allowed. Left no response.')
			return
		}
		var clientX = touches[0].clientX
		var clientY = touches[0].clientY

		var args = {
			target: $(window.particle.PatchJS.patchDOM),
			marker: $(event.target).parent(),
			clientX: clientX,
			clientY: clientY
		}

		var offset = args.target.offset()
		var displayx = args.clientX - offset.left
		var displayy = args.clientY - offset.top
		var displayHeight = 1.0 * args.target.height()
		var displayWidth = 1.0 * args.target.width()
		if (displayx < 0 || displayy < 0 || displayx > displayWidth || displayy > displayHeight) {
			return
		}

		window.particle.PatchJS.undoredo.replaceUndo({
			originalArgs: event,
			instance: window.particle.PatchJS.undoredo
		})
		
		window.particle.PatchJS.markerMove(args)

		
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
		// console.log(click)
		if (typeof window.particle.PatchJS.patchDOM == "undefined") {
			return
		}
		if (click.buttons == 0) {
			return
		}
		var clientX = click.clientX
		var clientY = click.clientY

		var args = {
			target: $(window.particle.PatchJS.patchDOM),
			marker: $(event.target).parent(),
			clientX: clientX,
			clientY: clientY
		}

		var offset = args.target.offset()
		var displayx = args.clientX - offset.left
		var displayy = args.clientY - offset.top
		var displayHeight = 1.0 * args.target.height()
		var displayWidth = 1.0 * args.target.width()
		if (displayx < 0 || displayy < 0 || displayx > displayWidth || displayy > displayHeight) {
			return
		}

		window.particle.PatchJS.undoredo.replaceUndo({
			originalArgs: event,
			instance: window.particle.PatchJS.undoredo
		})

		window.particle.PatchJS.markerMove(args)
	}

	/**
	 * The function to make the mark start.
	 * @param  {Object} args The object of the touch or click event
	 *                       clientX: the X position of the touch or click
	 *                       clientY: the Y position of the touch or click
	 *                       target: the JQuery object of the target element
	 * @return {[type]}      [description]
	 */
	PatchJS.prototype.markStart = function(args) {
		/* The coordinate system.
		 * # # # # # # # # # # 
		 * # o ------------------------------- x
		 * # |     ________________________
		 * # |    |(x,y)                   |
		 * # |    |                        |
		 * # |    |                        |
		 * # |    |________________________|     
		 * # |                              (x+width, y+height)
		 * # |
		 * # y
		 * #
		 */

		var touchx = args.clientX
		var touchy = args.clientY
		var offset = args.target.offset()
		var displayx = touchx - offset.left
		var displayy = touchy - offset.top
		var realHeight = 1.0 * args.target.attr("data-height")
		var realWidth = 1.0 * args.target.attr("data-width")
		var displayHeight = 1.0 * args.target.height()
		var displayWidth = 1.0 * args.target.width()
		var realx = Math.round(1.0 * displayx * realHeight / displayHeight)
		var realy = Math.round(1.0 * displayy * realWidth / displayWidth)
		// console.log('start event')
		// console.log("in display image size, x: %d, y: %d", displayx, displayy)
		// console.log("in real image size, x: %d, y: %d", realx, realy)

		/** create a new point center element */
		var newcenter = $(".pointCenter.hidden").clone(true)
		/** push the undo function into the array */
		window.particle.PatchJS.undoredo.pushUndo({
			recover: function(args) {
				args.newcenter.hide()
				var newcenterIndex = window.particle.PatchJS.points.indexOf(args.newcenter[0])
				console.log(newcenterIndex)
				window.particle.PatchJS.points.splice(newcenterIndex, 1)
			},
			redo: function(args) {
				args.newcenter.show()
				window.particle.PatchJS.points.push(args.newcenter[0])
				window.particle.PatchJS.undoredo.pushUndo(args.undoOptions)
			},
			args: {
				originalArgs: args,
				newcenter: newcenter,
				useAllArgs: true,
				passOptions: true
			},
			instance: window.particle.PatchJS.undoredo
		})
		newcenter.attr('data-real-x',realx).attr('data-real-y', realy)
		newcenter.removeClass('hidden')
		newcenter.css('left',touchx).css('top',touchy)
		newcenter.children('img').bind("touchstart", window.particle.PatchJS.onTouchMoveStart)
		newcenter.children('img').bind("touchmove", window.particle.PatchJS.onTouchMove)
		newcenter.children('img').bind("mousedown", window.particle.PatchJS.onClickMoveStart)
		newcenter.children('img').bind("mousemove", window.particle.PatchJS.onClickMove)
		$(".pointCenter.hidden").after(newcenter)
		window.particle.PatchJS.points.push(newcenter[0])

	}

	/**
	 * The function to make the marker move.
	 * @param  {Object} args The object of the touch or click event
	 *                       clientX: the X position of the touch or click
	 *                       clientY: the Y position of the touch or click
	 *                       target: the JQuery object of the target element
	 *                       marker: the JQuery object of the marker element
	 * @return {[type]}      [description]
	 */
	PatchJS.prototype.markerMove = function(args) {
		/* The coordinate system.
		 * # # # # # # # # # # 
		 * # o ------------------------------- x
		 * # |     ________________________
		 * # |    |(x,y)                   |
		 * # |    |                        |
		 * # |    |                        |
		 * # |    |________________________|     
		 * # |                              (x+width, y+height)
		 * # |
		 * # y
		 * #
		 */

		var touchx = args.clientX
		var touchy = args.clientY
		var offset = args.target.offset()
		var displayx = touchx - offset.left
		var displayy = touchy - offset.top
		var realHeight = 1.0 * args.target.attr("data-height")
		var realWidth = 1.0 * args.target.attr("data-width")
		var displayHeight = 1.0 * args.target.height()
		var displayWidth = 1.0 * args.target.width()
		var realx = Math.round(1.0 * displayx * realHeight / displayHeight)
		var realy = Math.round(1.0 * displayy * realWidth / displayWidth)
		// console.log('move event')
		// console.log("in display image size, x: %d, y: %d", displayx, displayy)
		// console.log("in real image size, x: %d, y: %d", realx, realy)

		// console.log(args.marker)
		/** modify the point center element */
		args.marker.attr('data-real-x',realx).attr('data-real-y', realy)
		args.marker.css('left',touchx).css('top',touchy)


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
					$(this).width("90vw")
					$(this).css("max-width", "500px")
				} else {
					$(this).height("90vh")
					$(this).css("max-height", "500px")
				}
				/** bind some events */
				$(this).bind("touchstart", window.particle.PatchJS.onTouchStart)
				$(this).bind("mousedown", window.particle.PatchJS.onClickStart)

				/** fade In the image when loaded*/
				$(this).fadeIn()
			}
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
			/** add the image element into destination */
			options.dest.append($(imageDOM))
		}
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
		window.particle.DataService.getTask(options)
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