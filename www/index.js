Parse.initialize("7JSMjdDlgmtsWgGY5LOPMm3tCluhAo7Wmuu9MLpf", "75P9wy6X6guG9HRUvMxcVueLjZ93ljY56z3jrgAN");

$(document).on("mobileinit", function()  {
  $.mobile.ajaxEnabled = true;
  $.support.cors = true;
  $.mobile.allowCrossDomainPages = true;
});

user = {
	login: function(options) {
		window.particle.DataService.login({
			username: options.id,
			password: options.token,
			callback: options.callback,
			errorHandler: function(obj, error) {
				var loginerrormsg = "<div style='display:none' class='alert alert-warning alert-dismissible' role='alert' style='margin-bottom:0'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>"+JSON.parse(JSON.stringify(error)).message+"</div>"
				$("#loginerror").html(loginerrormsg)
				$("#loginerror div:first-child").slideDown()
			}
		})
	},
	autologin: function(options) {
		window.particle.DataService.login({
			callback: options.callback,
			errorHandler: function(obj, error) {
				if (error.code == '410') {
					/** no user setup info exist */
					$(".loginDiag").removeClass('active')
					$(".loginDiag > .diagbox").show()
					$(".loginDiag > .diagbox_input").css("transform", "rotateX(90deg)")
					$('body').append($(".loginDiag"))
					$(".loginDiag").addClass('active')
					$("#newSession").off('click').on('click', function(){
						window.particle.DataService.register({
							callback: function(userobj) {
								$(".loginDiag").removeClass('active')
								options.callback(userobj)
							},
							errorHandler: function(user, error, options) {
								window.particle.DataService.register({
									callback: options.callback,
									errorHandler: options.errorHandler,
									trytime: (options.trytime || 0) + 1,
								})
							}
						})
					})
					$("#transferSession").off('click').on('click', function(){
						$("#loginerror").html("")
						$("#input_id").val("")
						$("#input_token").val("")
						$(".loginDiag > .diagbox").hide()
						$(".loginDiag > .diagbox_input").css("transform", "rotateX(0deg)")
					})
					$("#backNewSession").off('click').on('click', function(){
						$(".loginDiag > .diagbox_input").css("transform", "rotateX(90deg)")
						setTimeout(function(){
							$(".loginDiag > .diagbox").show()
						}, 600)
					})
					$("#verifySession").off('click').on('click', function(event){
						if ($("#input_id").val().length > 0 && $("#input_token").val().length > 0) {
							event.preventDefault()
							window.particle.user.login({
								id: $("#input_id").val(),
								token: $("#input_token").val(),
								callback: options.callback
							})
						}
					})
				}
			} 
		})
	}
}

ajaxloader = {
	callback: false,
	// rootpath: "http://crowdsourcinghelpful.parseapp.com/pages/",
	rootpath: "./pages/",
	/**
	 * the entry to request a get function
	 * @param  {String} id The id of file, it normally comes with the form "./<id>.html"
	 * @return {[type]}    [description]
	 */
	get : function(id) {
		var href = this.rootpath+id+".html"
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
			if (contentBackgroundColor == "black") {
				$('meta[name=apple-mobile-web-app-status-bar-style]').attr('content', 'black');
			} else {
				$('meta[name=apple-mobile-web-app-status-bar-style]').attr('content', 'black-translucent');
			}
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

setting = {
	expose: function(event) {
		$("body").append($("#menu-expose-origin"))
		$("#menu-expose-origin").removeClass("exposing")
		$("#menu-expose-origin").css("left", event.clientX.toString()+"px")
		$("#menu-expose-origin").css("top", event.clientY.toString()+"px")
		$("#menu-expose-origin").addClass("exposing")
		setTimeout(function() {
			$("#setting").removeClass('active').off('click').on('click', function(){
				$("#setting").removeClass('active')
			})
			$("#setting > .diagbox").show().off('click').on('click', function(e){
				e.stopPropagation()
			})
			$('body').append($("#setting"))
			$("#setting").addClass('active')
			$("#setting_id").html("<span style='text-weight: bold; margin-left:5%; width: 10%; display: inline-block; text-align:left;'>id:</span><span style=' display: inline-block; width: 80%; text-align:right;'>"+localStorage.username+"</span>")
			$("#setting_token").html("<span style='text-weight: bold; margin-left:5%; width: 30%; display: inline-block; text-align:left;'>token:</span><span style=' display: inline-block; width: 60%; text-align:right;'>"+localStorage.password+"</span>")
			$("#setting_confidence").html("<span style='text-weight: bold; margin-left: 5%; width: 50%;  display: inline-block;'>confidence:</span><span style=' display: inline-block; width: 40%; text-align:right;'>"+window.particle.user.confidence.toString()+"</span>")
			$("#menu-expose-origin").removeClass("exposing")
		},1500)
	}
}

window.particle = {}
window.particle.DataService = DataService.init()
window.particle.PatchJS = PatchJS.init()
window.particle.ReviewPatchJS = ReviewPatchJS.init()
window.particle.user = user
window.particle.setting = setting