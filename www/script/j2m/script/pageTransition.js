;(function () {
	
	/**
	 * The module for native-like page transition between the pages of a multi-page web app
	 * 
	 */
	
	/**
	 * The first part load and manage the pages of the app
	 * The second part handle the touch events
	 */
	
	function pageTransition(options) {

		/** disable the native touch move functionality */
		window.addEventListener("touchmove", function(event) {
            event.preventDefault()
        }, false)

		/**
		 * a stack of the touches
		 * @type {Array}
		 */
		this.touches = []

		options = options || {}

		/**
		 * The selector which indicate the element be binded the touch events
		 * @type {String}
		 */
		this.selector = options.selector || "body"

		/**
		 * an empty module for the page // now based on the jquery mobile
		 * @type {Element}
		 */
		this.initPage = $("#init").clone(true)
		$("#init").remove()

		/**
		 * the ajax-based loader to get the content of pages
		 * @type {Object}
		 */
		this.ajaxloader = options.ajaxloader || {
            num: 1,
            get: function(id) {
                // console.log("called fackget")
                this.done = false
                var obj = {}
                // var randstr = Math.random().toString().substr(2)
                var randstr = this.num.toString()
                if (typeof id != "undefined" && id != null) {
                    randstr = id
                }
                this.num += 1
                var dd = Math.round(Math.random()*5000)
                var strdd = ""
                for (var i=0; i< dd; i++) {
                    strdd += Math.round(Math.random()*10).toString()
                }
                obj.pageid = randstr
                obj.pageId = randstr
                obj.header = "<h1>Title</h1><a href='#' data-href='' data-nav='back'>Back</a>"
                obj.main = "<a href='#' data-href='"+this.num.toString()+"' data-transition='none'>To "+this.num.toString()+"</a><p style='word-break: break-all;'>"+strdd+"</p>"
                obj.content = obj.main
                obj.contentAttr = {
                    "overscroll": "true"
                }
                obj.title = randstr
                obj.footer = "<h1>Footer</h1>"
                // console.log("fackget return")
                // 
                this.obj = obj
                this.done = true
                return obj
            }
        }

		/**
		 * a stack of the loaded pages
		 * @type {Array}
		 */
		this.pageStack = []

		/**
		 * a trash for the element which has been returned
		 * @type {Array}
		 */
		this.pageTrash = []

		/**
		 * The width of left area which can trigger back transition
		 * @type {Number}
		 */
		this.leftActive = options.leftActive || 30

		/**
		 * The background color of the transition
		 * @type {String}
		 */
		this.backgroundColor = options.backgroundColor || "black"

		/**
		 * The initial scale for the previous page
		 * @type {Number}
		 */
		this.initScale = options.initScale || 0.92

		/**
		 * The initial shift on the x direction
		 * @type {[type]}
		 */
		this.initShift = options.initShift || -0.3

		/**
		 * The initial opacity for the previous page
		 * @type {Number}
		 */
		this.initOpac = options.initOpac || 0.5

		/**
		 * Once the swipe width over the backActive region of the whole width, back event is triggered
		 * @type {Number}
		 */
		this.backActive = options.backActive || 0.3

		/**
		 * The millisecond time of the page transition on a back event
		 * @type {Number}
		 */
		this.transitionTime = options.transitionTime || 200

		/**
		 * The damping of the smooth scroll
		 * @type {Number}
		 */
		this.scrollDamping = options.scrollDamping || 6

		/**
		 * Call the loadPage function to load the target file
		 * @param  {Number} window.location.hash.length The length of specific hash tag. When it's zero, load the default page
		 * @return {[type]}                             [description]
		 */
		if (window.location.hash.length == 0) {
			this.loadPage(options.initPage)
		} else {
			this.loadPage(window.location.hash.slice(1))
		}

		/**
		* Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
		*
		* @type boolean
		*/
		this.deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;

		/**
		 * Android requires exceptions.
		 *
		 * @type boolean
		 */
		this.deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !this.deviceIsWindowsPhone;


		/**
		 * iOS requires exceptions.
		 *
		 * @type boolean
		 */
		this.deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !this.deviceIsWindowsPhone;


		/**
		 * iOS 4 requires an exception for select elements.
		 *
		 * @type boolean
		 */
		this.deviceIsIOS4 = this.deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


		/**
		 * iOS 6.0-7.* requires the target element to be manually derived
		 *
		 * @type boolean
		 */
		this.deviceIsIOSWithBadTarget = this.deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);

		/**
		 * iOS 6.0-7.* requires the target element to be manually derived
		 *
		 * @type boolean
		 */
		this.deviceIsIOS9 = this.deviceIsIOS && (/OS 9_\d(_\d)?/).test(navigator.userAgent);

		/**
		 * BlackBerry requires exceptions.
		 *
		 * @type boolean
		 */
		this.deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;
		
		return this
	}	

	/**
	 * function to get the element's id of the previous page
	 * @author Yaliang
	 * @anotherdate 2015-08-17T21:44:04+0800
	 * @return      {String}                 The id of previous page
	 */
	pageTransition.prototype.prevPage = function() {
		if (this.pageStack.length < 2) {
			return undefined
		} else {
			return this.pageStack[this.pageStack.length - 2]
		}
	}

	/**
	 * function to get the element's id of current page
	 * @author Yaliang
	 * @anotherdate 2015-08-17T20:45:22+0800
	 * @return      {String}                 The id of the current page
	 */
	pageTransition.prototype.nowPage = function() {
		if (this.pageStack.length == 0) {
			return undefined
		} else {
			return this.pageStack[this.pageStack.length - 1]
		}
	}

	/**
	 * function to pop current page from the page stack
	 * @author Yaliang
	 * @anotherdate 2015-08-17T20:47:00+0800
	 * @return      {String}                 The id of the current page
	 */
	pageTransition.prototype.popPage = function() {
		return this.pageStack.pop()
	}

	/**
	 * create the element of the next page and append to "body"
	 * @author Yaliang
	 * @anotherdate 2015-08-17T20:47:45+0800
	 * @param       {Object}                 obj The page definition
	 * @return      {Element}                    The element of new appended page
	 */
	pageTransition.prototype.createPage = function(obj) {

		/**
		 * obj is an extracted object to specific the content and setup of the new page
		 *
		 * obj.pageId: the id of the page
		 * obj.pageUrl: the url of the page
		 * obj.header: the header of the page
		 * obj.content: the main content of the page
		 * obj.footer: the footer of the page
		 * 
		 */

		/**
		 * The element which fulfilled with the new page's contents
		 * @type {Element}
		 */
		var newPage = this.initPage.clone(true)
		newPage.attr("id", obj.pageId)
		newPage.attr("data-url", obj.pageUrl)
		newPage.attr("data-title", obj.title)
		newPage.children(".ctrl-page-header").attr("id",obj.pageId+"-header").html(obj.header)
		newPage.children(".ctrl-page-content").attr("id",obj.pageId+"-content").html(obj.content)
		newPage.children(".ctrl-page-footer").attr("id",obj.pageId+"-footer").html(obj.footer)

		

		/** add attribution for content part*/
		var contentAttr = obj.contentAttr || {}

		var contentAttrOverScroll = contentAttr.overscroll || false

		if (contentAttrOverScroll == true) {
			newPage.children(".ctrl-page-content").attr("data-overscroll", "true")
		}

		if (contentAttr.backgroundColor) {
			newPage.children(".ctrl-page-content").css("background-color", contentAttr.backgroundColor)
		}

		$("body").append(newPage)

		/** set statue bar in ios */
		if (this.deviceIsIOS9 && !isPhonegap) {
			console.log("statue bar style not working")
			newPage.children(".ctrl-page-header").css("border-top", "0px")
			newPage.children(".ctrl-page-header").css("background-color", "white")
		} else if (this.deviceIsIOS) {
			newPage.children(".ctrl-page-header").css("padding-top", "20px")
			console.log(newPage.find(".header-btn"))
			newPage.find(".header-btn").each(function() {
				$(this).css("margin-top", "20px")
			})
		}

		newPage.find("a").bind("click", this, function(event) {
			if ($(this).attr("data-nav") == "back") {
				// event.data.backPage()
			} else {
				var href = $(this).attr("data-href")
				event.data.loadPage(href)
			}
		})

		$(document).on("pageshow", "#"+obj.pageId, this, function(event) {

			console.log("a default pageshow event is fired on #"+$(this).attr("id"))

			if (event.data.ajaxloader.callback) {
				event.data.ajaxloader.callback()
				event.data.ajaxloader.callback = false
			}
			/**
			 * Set the touch Events, this functionality might be able to move into load page function
			 */

			event.data.initTouch({
				prevPage: "#" + event.data.prevPage(),
				nowPage: "#" + event.data.nowPage(),
				backFunction: event.data.backPage
			})

			$(this).css("overflowY","hidden")

			/**
			 * Set the outerHeight of content element
			 */
			
			var window_height = $(window).height()
			var head_height = $(this).children(".ctrl-page-header").outerHeight()
			var foot_height = $(this).children(".ctrl-page-footer").outerHeight()

			$(this).children(".ctrl-page-content").outerHeight(window_height - head_height - foot_height).css("overflowY", "scroll")
			$(this).children(".ctrl-page-content").css({
				"position":"relative",
				"top": "0px"
			})
			if ( !$(this).children(".ctrl-page-content").prev().hasClass("touch-scroll-bar") ) {
				$(this).children(".ctrl-page-content").before("<div class='touch-scroll-bar'></div>")
			}


		})

		return newPage

	}

	/**
	 * The function to call a AJAX get and record the pages
	 * @author Yaliang
	 * @anotherdate 2015-08-17T21:09:26+0800
	 * @param       {String}                 id The identification for the page need to be loaded
	 * @return      {Element}                   The loaded page
	 */
	pageTransition.prototype.loadPage = function(id) {
		this.ajaxloader.get(id)
		console.log("loaderInterval setup")
		this.loaderInterval = setInterval(function(a) {
			if (a.ajaxloader.done == true) {
				window.clearInterval(a.loaderInterval)
				console.log("loaderInterval has cleared")
				var obj = a.ajaxloader.obj
				var newPage = null

				if (a.pageStack.indexOf(obj.pageId) == a.pageStack.length-1) {
					a.pageStack.splice(a.pageStack.indexOf(obj.pageId), 1)
				}
				a.pageStack.push(obj.pageId)

				/** print current page stack */
				// console.log(a.pageStack)

				if ($("#"+id).length == 0) {
					newPage = a.createPage(obj)
				} else {
					newPage = $("#"+id)
					$("body").append(newPage)
				}

				$( ":mobile-pagecontainer" ).pagecontainer( "change", "#"+obj.pageId, {
					transition: "none",
					changeHash: "false",
				} );
			}
		}, 100, this)

	}

	/**
	 * The function which need to be called when a back function triggered
	 * @author Yaliang
	 * @anotherdate 2015-08-17T21:11:34+0800
	 * @return      {[type]}                 [description]
	 */
	pageTransition.prototype.backPage = function() {

		/** maintain the pageStack */
		this.popPage()
		console.log(this.pageStack)

		/**
		 * manually change the active page class.
		 * The purpose of this operation is to avoid the flicker happened at the moment 
		 * when the page pop back to the previous page
		 */
		this.nowElement.removeClass("ui-page-active")
		this.prevElement.addClass("ui-page-active")

		/**
		 * remove the element, when the page set need to removed when it is pop from history stack
		 * or request a force reload when it's reappeared
		 */
		if (this.nowElement.attr("data-remove") == "forever" || this.nowElement.attr("data-reload") == "true") {
			this.pageTrash.push(this.nowElement)
			this.nowElement.remove()
		} else {
			$("body").append(this.prevElement)
		}

		/** pop a history state of the previous page */
		// window.history.back()
		$( ":mobile-pagecontainer" ).pagecontainer( "change", "#"+this.prevElement.attr("id"), {
			transition: "none",
			changeHash: "false"
		} );

	}

	/**
	 * The function to unbind the x-controller
	 * @return {[type]} [description]
	 */
	pageTransition.prototype.touchXcontrollerStop = function() {
		/** stop the animation */
		this.touchAnimateStop()

		/** unbind the touch listener when $(this.selector) exists*/
		if (typeof this.selector != "undefined" && $(this.selector).length > 0) {
			$(this.selector).unbind("touchstart").unbind("touchmove").unbind("touchend")
		}
	}

	/**
	 * The function to stop the animation applied on the current and previous elements
	 * @return {[type]} [description]
	 */
	pageTransition.prototype.touchAnimateStop = function() {
		if (typeof this.nowElement != "undefined" && this.nowElement.length > 0) {
			this.nowElement.finish()
			this.nowElement.css("left","")
			this.nowElement.css("width","")
		}

		if (typeof this.prevElement != "undefined" && this.prevElement.length > 0) {
			this.prevElement.finish()
			this.prevElement.css("transform", "").css("-webkit-transform", "").css("-moz-transform", "")
			this.prevElement.attr("data-scale","")
			this.prevElement.css("opacity", "")
			this.prevElement.css("display", "")
			this.prevElement.css("left","")
		}
	}

	/**
	 * The event handler which handle the touch start.
	 * @param  {Object} event The event object of the touch event
	 * @return {[type]}       [description]
	 */
	pageTransition.prototype.touchXcontrollerStartEvent = function(event) {

		var fullwidth = $(window).width()

		var prevElementScale = this.initScale
		var scaleString = "scale("+prevElementScale.toString()+","+prevElementScale.toString()+")"
		this.prevElement.css("transform", scaleString).css("-webkit-transform", scaleString).css("-moz-transform", scaleString)
		this.prevElement.attr("data-scale", prevElementScale.toString())

		var prevElementShift = this.initShift * fullwidth
		this.prevElement.css("left", Math.round(prevElementShift).toString() + "px")

		var prevElementOpac = this.initOpac
		this.prevElement.css("opacity", prevElementOpac.toString())

	}

	/**
	 * The event handler which handle the touch move
	 * @param  {Object} event The event object of the touch event
	 * @return {[type]}       [description]
	 */
	pageTransition.prototype.touchXcontrollerMoveEvent = function(event, deltaMoveX) {

		/** if the touch start point is in the left active area, then the animation of transition is updated. Otherwise, stop the animation */
		if (this.prevElement.length > 0) {
			/** set the previous element visible */
			this.prevElement.css("display", "block")

			/** set the transition background */
			$(this.selector).css("background-color",this.backgroundColor)

			/** set the transition animation*/
			var distance = Math.max(parseFloat(this.nowElement.css("left")) + deltaMoveX, 0)
			var fullwidth = $(window).width()
			this.nowElement.children(".ui-content").outerWidth(fullwidth)
			this.nowElement.css("left", distance.toString()+"px")
			this.nowElement.css("width", (fullwidth - distance).toString()+"px")

			var prevElementScale = this.initScale + (1.0 - this.initScale)*(1.0*distance / fullwidth)
			var scaleString = "scale("+prevElementScale.toString()+","+prevElementScale.toString()+")"
			this.prevElement.css("transform", scaleString).css("-webkit-transform", scaleString).css("-moz-transform", scaleString)
			this.prevElement.attr("data-scale", prevElementScale.toString())

			var prevElementShift = (this.initShift + (0 - this.initShift)*(1.0*distance / fullwidth))*fullwidth
			this.prevElement.css("left", Math.round(prevElementShift).toString() + "px")

			var prevElementOpac = this.initOpac + (1.0 - this.initOpac)*(1.0*distance / fullwidth)
			this.prevElement.css("opacity", prevElementOpac.toString())

		} else {
			this.touchAnimateStop()
		}
	}

	/**
	 * The event handler which handle the touch end
	 * @param  {Object} event The event object of the touch event
	 * @return {[type]}       [description]
	 */
	pageTransition.prototype.touchXcontrollerEndEvent = function(event) {

		if ((( typeof $(event.target).attr("data-nav") != "undefined" && $(event.target).attr("data-nav").toLowerCase() == "back") || parseFloat(this.nowElement.css("left")) > 0) && this.prevElement.length > 0) {
			console.log()
			var distance = parseFloat(this.nowElement.css("left"))
			var fullwidth = $(window).width()
			/** set the previous element visible */
			this.prevElement.css("display", "block")

			/** set the transition background */
			$(this.selector).css("background-color",this.backgroundColor)

			/** initialize the current element's width */
			// this.nowElement.children(".ui-content").css("width","")
			// this.nowElement.css("width", "")

			if (( typeof $(event.target).attr("data-nav") != "undefined") && ($(event.target).attr("data-nav").toString().toLowerCase() == "back") || distance > this.backActive * fullwidth) {
				/** The touch move distance is over the backActive region, which means page needs to pop back */

				/** start the jquery-based animation for transition between pages */
				this.prevElement.animate({
					"opacity": "1",
					"left": "0"
				}, {
					duration: this.transitionTime,
					progress: function(animate, now, remain) {
						var initScale = parseFloat($(this).attr("data-scale"))
						var nowScale = initScale + (1.0 - initScale)*(1.0*now) 
						var nowScaleStr = "scale("+nowScale.toString()+","+nowScale.toString()+")"
						$(this).css("transform",nowScaleStr).css("-webkit-transform",nowScaleStr).css("-moz-transform", nowScaleStr)
					}
				})

				this.nowElement.bind("transition-done", this, function(event) {
					event.data.touchAnimateStop()
					event.data.backPage()
					$(this).unbind("transition-done")
				})

				this.nowElement.animate({
					"left": fullwidth,
					"width": "0"
				}, {
					duration: this.transitionTime,
					complete: function() {
						$(this).trigger("transition-done")
					}
				})

			} else {
				/** The touch move distance is under the backActive region, which means keeping stay in current page */
				this.nowElement.bind("transition-cancel", this, function(event) {
					event.data.touchAnimateStop()
					$(this).unbind("transition-cancel")
				})

				/** start the jquery-based animation for transition of cancel page back */
				this.prevElement.animate({
					"opacity": this.initOpac.toString()
				}, {
					duration: this.transitionTime,
					progress: function(animate, now, remain) {
						var initScale = parseFloat($(this).attr("data-scale"))
						var nowScale = initScale + (pageTransition.initScale - initScale)*(1.0*now) 
						var nowScaleStr = "scale("+nowScale.toString()+","+nowScale.toString()+")"
						$(this).css("transform",nowScaleStr).css("-webkit-transform",nowScaleStr).css("-moz-transform", nowScaleStr)
					}
				})

				this.nowElement.animate({
					"left": "0",
					"width": fullwidth
				}, {
					duration: this.transitionTime,
					complete: function() {
						$(this).trigger("transition-cancel")
					}
				})
			}
		} else {
			this.touchAnimateStop()
		}

	}

	/**
	 * the function to update the location and the length of scroll bar at the side of target
	 * @return {[type]} [description]
	 */
	pageTransition.prototype.touchUpdateScrollBar =  function() {
		if (this.scrollElement.prev().hasClass("touch-scroll-bar")) {
			var scrollHeight = this.scrollElement[0].scrollHeight
			var clippedHeight = this.scrollElement.outerHeight()
			var scrollTop = this.scrollElement.scrollTop()
			var barHeight = Math.max(10, Math.round(1.0*clippedHeight*clippedHeight/scrollHeight * (1.0- (Math.abs(parseFloat(this.scrollElement.css("top")))*8.0 / clippedHeight))))
			var offset = this.scrollElement.offset().top
			if (parseFloat(this.scrollElement.css("top")) >= 0)
				offsetTop = this.scrollElement.offset().top + Math.round(1.0*scrollTop/scrollHeight * clippedHeight) - parseFloat(this.scrollElement.css("top"))
			else 
				offsetTop = this.scrollElement.offset().top + clippedHeight - barHeight - parseFloat(this.scrollElement.css("top"))
			
			this.scrollElement.prev().height(barHeight)
			this.scrollElement.prev().offset({top: offsetTop, right: 10})
		}
	}

	/**
	 * the function to fadeIn the scroll bar
	 * @return {[type]} [description]
	 */
	pageTransition.prototype.touchShowScrollBar = function() {
		if (this.scrollElement.prev().hasClass("touch-scroll-bar")) {
			var scrollHeight = this.scrollElement[0].scrollHeight
			var clippedHeight = this.scrollElement.outerHeight()
			if (scrollHeight > clippedHeight) {
				this.scrollElement.prev().finish()
				this.scrollElement.prev().css("opacity","")
				this.scrollElement.prev().show()
			}
		}
	}

	/**
	 * the function to fadeOut the scroll bar
	 * @return {[type]} [description]
	 */
	pageTransition.prototype.touchHideScrollBar = function() {
		if (this.scrollElement.prev().hasClass("touch-scroll-bar")) {
			this.scrollElement.prev().finish()
			this.scrollElement.prev().fadeOut()
		}
	}

	/**
	 * function to find the closest blocker whose y direction over-scroll is enabled
	 * @param  {Object} event the touch event
	 * @return {Array}       the closest blocker with enabled y-over-scroll
	 */
	pageTransition.prototype.touchFindClosestYOverScrollBlocker = function(event) {
		/** find the closest scroll-over-y enabled target */
		var closestBlocker = $(event.originalEvent.target)
		while (closestBlocker[0].parentElement != null && closestBlocker.length > 0 && closestBlocker.css("overflowY") != "scroll") {
			closestBlocker = closestBlocker.parent()
		}

		return closestBlocker
	}


	/**
	 * the function to handle a complete scroll functionality in oder to get a rebuilt over-scroll
	 * @param  {Number} deltaTop The difference on y direction
	 * @return {[type]}          [description]
	 */
	pageTransition.prototype.touchScroll = function(deltaTop) {
		var scrollHeight = this.scrollElement[0].scrollHeight
		var clippedHeight = this.scrollElement.outerHeight()
		var scrollToTop = this.scrollElement.scrollTop()
		var scrollToBottom = scrollHeight - clippedHeight - scrollToTop
		var currentCssTop = parseFloat(this.scrollElement.css("top"))
		var newScrollToTop = scrollToTop
		var newScrollToBottom = scrollToBottom
		var overscrollable = (this.scrollElement.attr("data-overscroll") || "").toLowerCase() == "true"
		var displayRate = 1.0 / (1.0 + 25.0 * Math.abs(currentCssTop) / clippedHeight)
		var loopnum = 0

		/** execute scroll-able methods in a designed priority*/
		while (Math.abs(deltaTop) > 0.001 && loopnum < 10) {
			loopnum += 1
			scrollToTop = this.scrollElement.scrollTop()
			scrollToBottom = scrollHeight - clippedHeight - scrollToTop
			currentCssTop = parseFloat(this.scrollElement.css("top"))
			displayRate = 1.0 / (1.0 + 25.0 * Math.abs(currentCssTop) / clippedHeight)
			if (deltaTop < 0 && currentCssTop < 0) {
				// case: touch move down, there has bottom over scroll, recovery this part first
				// currentCssTop is negative
				// if (loopnum > 1)
					// console.log("touch move down, case 1")
				newCssTop = currentCssTop + Math.min(- deltaTop, - currentCssTop)
				deltaTop = deltaTop + (newCssTop - currentCssTop)
				this.scrollElement.css("top", newCssTop.toString() + "px")
			} else if (deltaTop < 0 && scrollToTop > 0) {
				// case: touch move down, there has some space to scroll up
				// if (loopnum > 1)
					// console.log("touch move down, case 2")
				newScrollToTop = scrollToTop + Math.max(deltaTop, - scrollToTop)
				this.scrollElement.scrollTop(Math.round(newScrollToTop))
				deltaTop = deltaTop - (newScrollToTop - scrollToTop)
			} else if (deltaTop < 0 && scrollToTop == 0 && overscrollable == true) {
				// case: touch move down, the scroll element has scroll to top and it is over-scroll-able
				// if (loopnum > 1)
					// console.log("touch move down, case 3")
				newCssTop = currentCssTop - displayRate * deltaTop
				deltaTop = 0
				this.scrollElement.css("top", newCssTop.toString()+ "px")
			} else if (deltaTop < 0 && scrollToTop == 0 && overscrollable == false) {
				// case: touch move down, the scroll element has scroll to top and it is over-scroll-disable
				// if (loopnum > 1)
					// console.log("touch move down, case 4")
				deltaTop = 0
			} else if (deltaTop > 0 && currentCssTop > 0) {
				// case: touch move up, there has top over scroll, recovery this part first
				// currentCssTop is positive
				// if (loopnum > 1)
					// console.log("touch move up, case 5, currentCssTop: %d, deltaTop: %d", currentCssTop, deltaTop)
				newCssTop = currentCssTop + Math.max(- deltaTop, - currentCssTop)
				deltaTop = deltaTop + (newCssTop - currentCssTop)
				this.scrollElement.css("top", newCssTop.toString() + "px")
			} else if (deltaTop > 0 && scrollToBottom > 0) {
				// case: touch move up, there has some space to scroll down
				// if (loopnum > 1)
					// console.log("touch move up, case 6")
				newScrollToBottom = scrollToBottom + Math.max(- deltaTop, -scrollToBottom)
				newScrollToTop = scrollHeight - clippedHeight - newScrollToBottom
				this.scrollElement.scrollTop(Math.round(newScrollToTop))
				deltaTop = deltaTop - (newScrollToTop - scrollToTop)
			} else if (deltaTop > 0 && scrollToBottom == 0 && overscrollable == true) {
				// if (loopnum > 1)
					// console.log("touch move up, case 7")
				newCssTop = currentCssTop - displayRate * deltaTop
				deltaTop = 0
				this.scrollElement.css("top", newCssTop.toString()+"px")
			} else if (deltaTop > 0 && scrollToBottom == 0 && overscrollable == false) {
				// if (loopnum > 1)
					// console.log("touch move up, case 8")
				deltaTop = 0
			}

			// if (loopnum > 1) {
				// console.log(loopnum)
				// console.log(deltaTop)
			// }

		}
	}

	/**
	 * The function to handle the start of vertical touch events
	 * @param  {Object} event the m event of the jquery
	 * @return {[type]}       [description]
	 */
	pageTransition.prototype.touchYcontrollerStartEvent = function(event) {
		// console.log("touch start")
		if (typeof this.scrollBlock != "undefined" && this.scrollBlock)  {
			return
		}

		var closestBlocker = this.touchFindClosestYOverScrollBlocker(event)

		/** set up the scroll functionality */
		if (closestBlocker[0].parentElement == null && closestBlocker.css("overflowY") != "scroll") {
			/** ignore the scroll event */
			this.scrollElement = null
		} else {
			/** clear the previous smooth scroll event */
			if (typeof this.smoothScrollInterval != "undefined" && this.smoothScrollInterval != null) {
				window.clearInterval(this.smoothScrollInterval)
				this.smoothScrollInterval = null
			}

			/** clear previous animation inference */
			if (typeof this.scrollElement != "undefined" && this.scrollElement != null && this.scrollElement.length > 0) {
				// this.scrollElement.finish()
				// this.scrollElement.css("top", "0")

				this.scrollElement.unbind("smooth-scroll-done")
				this.scrollElement.unbind("update-scroll-bar")
				this.scrollElement.unbind("over-scroll-recovery")
			}

			/** initialize the scroll settings */
			this.scrollElement = closestBlocker
			this.touchUpdateScrollBar()
			this.touchShowScrollBar()
		}
	}

	/**
	 * the function to handle the move event of the scroll functionality
	 * @param  {Object} event The event of touch move
	 * @return {[type]}       [description]
	 */
	pageTransition.prototype.touchYcontrollerMoveEvent = function(event, deltaMoveY) {
		// console.log("touch move")
		if (typeof this.scrollElement != "undefined" && this.scrollElement != null && this.scrollElement.length > 0) {
			var moveRateY = (1+Math.round(Math.abs(deltaMoveY) / 10))
			if (moveRateY > 1) {
				this.slowMoveEventsTimeY = 0
			} else {
				this.slowMoveEventsTimeY += 1
			}

			var deltaTop = - deltaMoveY

			this.touchScroll(deltaTop)

			this.touchUpdateScrollBar()
			this.touchShowScrollBar()
		}
	}

	/**
	 * the function to handle the end event of touch in Y direction
	 * @param  {Object} event the touchend event
	 * @return {[type]}       [description]
	 */
	pageTransition.prototype.touchYcontrollerEndEvent = function(event) {
		// console.log("touch end")
		if (typeof this.scrollElement != "undefined" && this.scrollElement != null && this.scrollElement.length > 0) {

			/** bind the events for smooth scroll */
			this.scrollElement.bind("smooth-scroll-done", this, function(event) {
				event.data.touchHideScrollBar()
				event.data.scrollElement.unbind("smooth-scroll-done")
				event.data.scrollElement.unbind("update-scroll-bar")
				event.data.scrollBlock = false
			})

			this.scrollElement.bind("update-scroll-bar", this, function(event) {
				event.data.touchUpdateScrollBar()
			})

			/** bind the event to handle the over scroll animation */
			this.scrollElement.bind("over-scroll-recovery", this, function(event) {
				if (typeof event.data.smoothScrollInterval != "undefined" && event.data.smoothScrollInterval != null) {
					window.clearInterval(event.data.smoothScrollInterval)
					event.data.smoothScrollInterval = null
				}
				event.data.scrollElement.animate({
					"top":"0"
				}, {
					duration: 150,
					progress: function(animate, now, remain) {
						$(this).trigger("update-scroll-bar")
					},
					complete: function() {
						$(this).trigger("smooth-scroll-done")
					}
				})

				$(this).unbind("over-scroll-recovery")

			})

			/** handle smooth scroll */
			if (this.slowMoveEventsTimeY <= 1) {
				/** use the greater speed in current two events */ 
				if (Math.abs(this.touches[0].lastDy) > Math.abs(this.touches[0].currentDy)) {
					this.rawSpeedY = this.touches[0].lastDy
				} else {
					this.rawSpeedY = this.touches[0].currentDy
				}


			

				/** set the interval to update the smooth scroll */
				this.smoothScrollInterval = setInterval(function(a) {
					/** use damping model to build a smooth scroll animation */
					var deltatime = 3.0/1000
					var initSpeed = 1.0*a.rawSpeedY
					var acc = - a.scrollDamping * deltatime
					if (Math.abs(parseFloat(a.scrollElement.css("top"))) > 0.001) {
						acc -= 1.2 * parseFloat(a.scrollElement.css("top")) / initSpeed
					}

					var endSpeed = Math.max(0, (1 + acc)) * initSpeed
					var avgSpeed = (initSpeed + endSpeed) / 2.0
					var deltaTop = - avgSpeed * deltatime
					
					a.touchScroll(deltaTop)
					a.rawSpeedY = endSpeed

					a.touchUpdateScrollBar()
					a.touchShowScrollBar()
					if (Math.abs(deltaTop) < 0.05) {
						// console.log("stop called")
						a.scrollBlock = true
						a.scrollElement.trigger("over-scroll-recovery")
					}

				}, 3, this)

			} else {
				this.scrollElement.trigger("over-scroll-recovery")
			}



		}
	}

	/**
	 * the function to find the index of a touch object in the this.touches list
	 * @param  {number} touchid The identifier of a touch
	 * @return {number}         The index number of touch
	 */
	pageTransition.prototype.touchFind = function(touchid) {
		/** @type {Number} the finally return result, if nothing matched, return -1 */
		var touchindex = -1
		for (var i = 0; i< this.touches.length; i++) {
			if (this.touches[i].identifier == touchid) {
				touchindex = i
				break
			}
		}

		return touchindex
	}

	/**
	 * the function which print the touches information
	 * @return {[type]} [description]
	 */
	pageTransition.prototype.touchPrint = function() {
		var textmsg = "touches number: "+ this.touches.length.toString() + "</br>"
		for (var i = 0; i<this.touches.length; i++) {
			textmsg += this.touches[i].identifier.toString() + "</br>"
		}
		this.nowElement.children(".ctrl-page-content").children("p").html(textmsg)
	}

	/**
	 * the function which handle all touch start event, and initialize the x and y controller 
	 * @param  {Object} event The event object on touch start
	 * @return {[type]}       [description]
	 */
	pageTransition.prototype.touchOnStart = function(event) {

		/** when first finger touch the screen, initialize the y controller and set x to non-exist id */
		if (this.touches.length == 0) {
			this.prevElement = $("#"+this.prevPage())
			this.nowElement = $("#"+this.nowPage())
			this.touchXcontrollerStartEvent(event)
			this.touchYcontrollerStartEvent(event)
			this.touchXid = -1
		}

		/** for each touch, initialize the dynamic parameter and push to list */
		for (var i = 0; i< event.originalEvent.changedTouches.length; i++) {
			/** @type {Object} the new touch object */
			var newtouch = {
				touchObject: event.originalEvent.changedTouches[i]
			}
			newtouch.identifier = newtouch.touchObject.identifier

			/** check if this identifier is existed in list */
			if (this.touchFind(newtouch.identifier) != -1) {
				continue 
			}

			/** set the dynamic data */
			newtouch.startX = newtouch.touchObject.clientX
			newtouch.startY = newtouch.touchObject.clientY
			newtouch.lastX = newtouch.startX
			newtouch.lastY = newtouch.startY
			newtouch.lastT = event.timeStamp
			newtouch.currentX = newtouch.startX
			newtouch.currentY = newtouch.startY
			newtouch.currentT = event.timeStamp
			newtouch.lastDx = 0.0
			newtouch.lastDy = 0.0
			newtouch.currentDx = 0.0
			newtouch.currentDy = 0.0
			newtouch.accX = 0.0
			newtouch.accY = 0.0

			/** push into touches list */
			this.touches.push(newtouch)

			/** if current touch is the first touch in the leftActive region, bind it to initialize the x controller */
			if (newtouch.startX < this.leftActive && this.touchXid == -1) {
				this.touchXid = this.touches.length - 1
			}
		}
	}

	/**
	 * the function to handle all touch move events and call for x and y controller in certain cases
	 * @param  {Object} event The event of touch move
	 * @return {[type]}       [description]
	 */
	pageTransition.prototype.touchOnMove = function(event) {
		var allDeltaMoveY = 0

		/** for each touches, calculate the dynamic data */
		for (var i = 0; i< event.originalEvent.changedTouches.length; i++) {

			/** find the touch index first */
			var touchid = event.originalEvent.changedTouches[i].identifier
			var touchindex = this.touchFind(touchid)

			if (touchindex == -1) {
				continue
			}

			/** update the dynamic data */
			this.touches[touchindex].touchObject = event.originalEvent.changedTouches[0]
			this.touches[touchindex].lastX = this.touches[touchindex].currentX
			this.touches[touchindex].lastY = this.touches[touchindex].currentY
			this.touches[touchindex].lastT = this.touches[touchindex].currentT
			this.touches[touchindex].currentX = this.touches[touchindex].touchObject.clientX
			this.touches[touchindex].currentY = this.touches[touchindex].touchObject.clientY
			this.touches[touchindex].currentT = event.timeStamp
			this.touches[touchindex].lastDx = this.touches[touchindex].currentDx
			this.touches[touchindex].lastDy = this.touches[touchindex].currentDy
			this.touches[touchindex].currentDx = 1.0 * (this.touches[touchindex].currentX - this.touches[touchindex].lastX) / (this.touches[touchindex].currentT - this.touches[touchindex].lastT) * 1000 // px/s
			this.touches[touchindex].currentDy = 1.0 * (this.touches[touchindex].currentY - this.touches[touchindex].lastY) / (this.touches[touchindex].currentT - this.touches[touchindex].lastT) * 1000 // px/s
			this.touches[touchindex].accX = 1.0 * (this.touches[touchindex].currentDx - this.touches[touchindex].lastDx) / (this.touches[touchindex].currentT - this.touches[touchindex].lastT) * 1000 // px/s^2
			this.touches[touchindex].accY = 1.0 * (this.touches[touchindex].currentDy - this.touches[touchindex].lastDy) / (this.touches[touchindex].currentT - this.touches[touchindex].lastT) * 1000 // px/s^2
			
			allDeltaMoveY += this.touches[touchindex].currentY - this.touches[touchindex].lastY

			/** if the touch object is the one binded to x controller, update the x controller */
			if (touchindex == this.touchXid) {
				this.touchXcontrollerMoveEvent(event, this.touches[touchindex].currentX - this.touches[touchindex].lastX)
			}

		}

		/** update the y controller */
		this.touchYcontrollerMoveEvent(event, 1.0 * allDeltaMoveY / event.originalEvent.changedTouches.length)


	}

	/**
	 * the function which handle all touch end events and call the x and y controller in proper way
	 * @param  {Object} event The event of the touch end event
	 * @return {[type]}       [description]
	 */
	pageTransition.prototype.touchOnEnd = function(event) {
		for (var i = 0; i< event.originalEvent.changedTouches.length; i++) {
			var touchid = event.originalEvent.changedTouches[i].identifier
			var touchindex = this.touchFind(touchid)
			
			if (touchindex == -1) {
				continue
			}

			/** if this is the last touch object in the list, we need to stop both x and y controller */
			if (this.touches.length == 1) {
				this.touchXcontrollerEndEvent(event)
				this.touchYcontrollerEndEvent(event)
				this.touchXid = -1
			}

			/** splice the old touch from touches list */
			var oldtouch = this.touches.splice(touchindex,1)
		}


	}

	/**
	 * The function to initialize the touch events, which including setting up the elements and binding events
	 * @param  {Object} options The options to specialize the elements related for the touch events
	 * @return {[type]}         [description]
	 */
	pageTransition.prototype.initTouch = function(options) {

		/** clear all touch stack */
		this.touches = []

		/** unbind touch event for x direction and stop animations */
		this.touchXcontrollerStop()

		/** set new elements reflecting the current and previous pages */
		this.prevElement = $(options.prevPage)
		this.nowElement = $(options.nowPage)

		/** rebind the touch events */
		$(this.selector).bind("touchstart", this, function(event) {
			event.data.touchOnStart(event)
		})
		$(this.selector).bind("touchmove", this, function(event) {
			event.data.touchOnMove(event)
		})
		$(this.selector).bind("touchend", this, function(event) {
			event.data.touchOnEnd(event)
		})
		$(this.selector).bind("touchcancel", this, function(event) {
			event.data.touchOnEnd(event)
		})
	}

	/**
	 * Faculty entry for the pageTransition module
	 * @param  {Object} options  The setup for the transition
	 * @return {Instant/Object}  Created instant of the pageTransition module
	 */
	pageTransition.init = function(options) {
		return new pageTransition(options)
	}

	window.pageTransition = pageTransition
}());