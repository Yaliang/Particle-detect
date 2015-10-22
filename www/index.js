Parse.initialize("7JSMjdDlgmtsWgGY5LOPMm3tCluhAo7Wmuu9MLpf", "75P9wy6X6guG9HRUvMxcVueLjZ93ljY56z3jrgAN");

DataService = {
	loadNewPatch: function(data, options) {
		var Patches = Parse.Object.extend("Patches")
		var query = new Parse.Query(Patches)

		query.count({
			success: function(count) {
				var randomSkipNumber=Math.floor(Math.random()*count)
				var query = new Parse.Query(Patches)
				query.skip(randomSkipNumber)
				query.limit(1)
				query.ascending("createdAt")

				query.find({
					success: function(patchesObj) {
						if (options.callback) {
							options.callback(patchesObj[0], options)
						}
					}
				})

			}
		})
	}
}

user = {
	id: "",
	username: "",
	/**
	 * function to auto login by the cache's token in localStorage
	 * @param  {Object} options Options
	 * @return {[type]}         [description]
	 */
	autologin: function(options) {
		var currentUser = Parse.User.current()

		options = options || {}

		if (currentUser) {
			user.id = currentUser.id
			user.username = currentUser.getUsername()
			options.dest = options.dest || "home"
			if (options.dest != "@current") {
				ajaxloader.callback = function() {
					if (pt.pageStack.indexOf("login") > -1) {
						pt.pageStack.splice(pt.pageStack.indexOf("login"), 1)
					}
					if ($("#login").length > 0) {
						$("#login").remove()
					}
					if (typeof pt.prevElement != "undefined" && pt.prevElement.attr("id") == "login") {
						pt.prevElement = $("#"+pt.prevPage())
					}
					if (pt.pageStack.indexOf("signup") > -1) {
						pt.pageStack.splice(pt.pageStack.indexOf("signup"), 1)
					}
					if ($("#signup").length > 0) {
						$("#signup").remove()
					}
					if (typeof pt.prevElement != "undefined" && pt.prevElement.attr("id") == "signup") {
						pt.prevElement = $("#"+pt.prevPage())
					}
					ajaxloader.callback = false
				}
				pt.loadPage(options.dest)
			}
		} else {
			pt.loadPage("login")
		}
	},
	/**
	 * login function 
	 * @return {[type]} [description]
	 */
	login: function() {
		var myname = $("#username").val()
		var mypass = $("#password").val()
		Parse.User.logIn(myname, mypass, {
			success: function(userObj) {
				$("#loginerror").html("")
				console.log(userObj)
				user.id = userObj.id
				user.username = userObj.getUsername()
				ajaxloader.callback = function() {
					if (pt.pageStack.indexOf("login") > -1) {
						pt.pageStack.splice(pt.pageStack.indexOf("login"), 1)
					}
					if ($("#login").length > 0) {
						$("#login").remove()
					}
					if (typeof pt.prevElement != "undefined" && pt.prevElement.attr("id") == "login") {
						pt.prevElement = $("#"+pt.prevPage())
					}
					if (pt.pageStack.indexOf("signup") > -1) {
						pt.pageStack.splice(pt.pageStack.indexOf("signup"), 1)
					}
					if ($("#signup").length > 0) {
						$("#signup").remove()
					}
					if (typeof pt.prevElement != "undefined" && pt.prevElement.attr("id") == "signup") {
						pt.prevElement = $("#"+pt.prevPage())
					}
					ajaxloader.callback = false
				}
				pt.loadPage("home")
			},
			error: function(error) {
				var loginerrormsg = "<div style='display:none' class='alert alert-warning alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>"+JSON.parse(JSON.stringify(error)).message+"</div>"
				$("#loginerror").html(loginerrormsg)
				$("#loginerror div:first-child").slideDown()
			}
		});
	},
	/**
	 * sign up function
	 * @return {[type]} [description]
	 */
	signup: function() {
		var myname = $("#signup-username").val()
		var mypass = $("#signup-password").val()

		var myuser = new Parse.User()
		myuser.set("username", myname)
		myuser.set("password", mypass)

		myuser.signUp(null, {
			success: function(userObj) {
				$("#signuperror").html("")
				console.log(userObj)
				user.id = userObj.id
				user.username = userObj.getUsername()
				ajaxloader.callback = function() {
					if (pt.pageStack.indexOf("signup") > -1) {
						pt.pageStack.splice(pt.pageStack.indexOf("signup"), 1)
					}
					if ($("#signup").length > 0) {
						$("#signup").remove()
					}
					if (pt.prevElement.attr("id") == "signup") {
						pt.prevElement = $("#"+pt.prevPage())
					}

					if (pt.pageStack.indexOf("login") > -1) {
						pt.pageStack.splice(pt.pageStack.indexOf("login"), 1)
					}
					if ($("#login").length > 0) {
						$("#login").remove()
					}
					if (pt.prevElement.attr("id") == "login") {
						pt.prevElement = $("#"+pt.prevPage())
					}
					
					ajaxloader.callback = false
				}
				pt.loadPage("home")
			},
			error: function(userObj, error) {
				console.log(error)
				var signuperrormsg = "<div style='display:none' class='alert alert-warning alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>"+JSON.parse(JSON.stringify(error)).message+"</div>"
				$("#signuperror").html(signuperrormsg)
				$("#signuperror div:first-child").slideDown()

			}
		})
	},
	/**
	 * logout function
	 * @return {[type]} [description]
	 */
	logout: function() {
		Parse.User.logOut()

		pt.loadPage("login")
	},
	/**
	 * acquire the user's name / user object by the id of user object
	 * @param  {String} userid  The id of user object
	 * @param  {Object} options Options
	 * @return {[type]}         [description]
	 */
	acquireUserNameById : function(userid, options) {
		DataService.getUserNameByUserId(userid, options)
	},
	/**
	 * function to add a connection between current user and target user
	 * @param {String} userid  The id of target user
	 * @param {[type]} options [description]
	 */
	addConnect: function(userid, options) {
		DataService.addConnectByUserId(userid, options)
	},
	getConnection: function(options) {
		DataService.getConnectionOfCurrentUser(options)
	}
}

ajaxloader = {
	callback: false,
	/**
	 * the entry to request a get function
	 * @param  {String} id The id of file, it normally comes with the form "./<id>.html"
	 * @return {[type]}    [description]
	 */
	get : function(id) {
		var href = "./pages/"+id+".html"
		ajaxloader.done = false
		$.get(href, function(data) {
			ajaxloader.extract(data)
			ajaxloader.done = true
		})
	},
	/**
	 * the function to extract the packaged file
	 * @param  {String} data The content of the file
	 * @return {Object}      The unpackaged object
	 */
	extract : function(data) {

		var obj = {}

		var pageid = data.substring(data.indexOf("<pageid>") + 8, data.indexOf("</pageid>"))
		if (pageid != null) {
			obj.pageid = pageid
			obj.pageId = pageid
		} else {
			obj.pageid = ""
			obj.pageId = ""
		}

		var title = data.substring(data.indexOf("<title>") + 7, data.indexOf("</title>"))
		if (title != null) {
			obj.title = title
		} else {
			obj.title = ""
		}

		var header = data.substring(data.indexOf("<header>") + 8, data.indexOf("</header>"))
		if (header != null) {
			obj.header = header
		} else {
			obj.header = ""
		}

		var main = data.substring(data.indexOf("<main>") + 6, data.indexOf("</main>"))
		if (main != null) {
			obj.main = main
			obj.content = main
		} else {
			obj.main = ""
			obj.content = ""
		}

		obj.contentAttr = {}
		var contentAttrOverscroll = data.substring(data.indexOf("<contentAttrOverscroll>") + 23, data.indexOf("</contentAttrOverscroll>"))
		if (contentAttrOverscroll != null) {
			obj.contentAttr.overscroll = contentAttrOverscroll == "true"
		}

		var contentBackgroundColor = data.substring(data.indexOf("<contentBackgroundColor>") + 24, data.indexOf("</contentBackgroundColor>"))
		if (contentBackgroundColor != null) {
			obj.contentAttr.backgroundColor = contentBackgroundColor
		}

		var footer = data.substring(data.indexOf("<footer>") + 8, data.indexOf("</footer>"))
		if (footer != null) {
			obj.footer = footer
		} else {
			obj.footer = ""
		}


		this.obj = obj

		return obj
	},
}

patchJS = {
	onTouchStart: function(event) {
		var touches = event.originalEvent.targetTouches
		console.log(touches)
		console.log(patchJS.patchEle)
		if (touches.length > 1) {

			$.mobile.loading( 'show', {
				text: "Pending", 
				textVisible: "true", 
				html: "<h1 id='loader-text'>Only one finger touch the image</h1><div style='position:fixed; top:0; left:0; width:100vw; height: 100vh; background-color:black; opacity:0.75' onclick='$.mobile.loading(\"hide\")'></div>"
			})
		} else {
			var offset = $(event.target).offset()
			var touchx = touches[0].clientX
			var touchy = touches[0].clientY
			var imagex = touchx - offset.left
			var imagey = touchy - offset.top
			var imageHeight = 1.0 * $(event.target).attr("data-height")
			var imageWidth = 1.0 * $(event.target).attr("data-width")
			var displayHeight = 1.0 * $(event.target).height()
			var displayWidth = 1.0 * $(event.target).width()
			console.log("imagex: %d, imagey: %d", imagex, imagey)
			console.log("realx: %d, realy: %d", Math.round(1.0 * imagex * imageWidth / displayWidth), Math.round(1.0 * imagey * imageHeight / displayHeight))
		}
	}
}