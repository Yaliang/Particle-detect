;(function () {
	/**
	 * The module is designed to prove some functions which used for interaction 
	 * in a patch selection task.
	 */
	
	function undoredo(options) {

		options = options || {}

		/** the undo function */
		this.undo = []

		/** get the undo element */
		this.undoButton = options.undoButton || []

		/** the redo function */
		this.redo = []

		/** get the redo element */
		this.redoButton = options.redoButton || []

		/** get the reset function */
		this.resetFunc = options.resetFunc || function(){}

		/** get the reset element */
		this.resetButton = options.resetButton || []

		/** when no reset available, remove active class */
		for (var i=0; i < this.resetButton.length; i++) {
			$(this.resetButton[i]).removeClass('active')
		}

		/** when no undo available, remove active class */
		for (var i=0; i < this.undoButton.length; i++) {
			$(this.undoButton[i]).removeClass('active')
		}

		/** when no redo available, remove active class */
		for (var i=0; i < this.redoButton.length; i++) {
			$(this.redoButton[i]).removeClass('active')
		}

		/** bind the keypress event*/
		$(window).off('keypress').keypress(this, function(event) {
			/** bind the keypress ctrl-z */
			if (event.ctrlKey && event.which == 26) {
				event.data.undoCall()
			}
			/** bind the keypress ctrl-y */
			if (event.ctrlKey && event.which == 25) {
				event.data.redoCall()
			}
			/** bind the keypress ctrl-q */
			if (event.ctrlKey && event.which == 17) {
				event.data.resetCall()
			}
		})

		/** bind the click and touch event for undo*/
		for (var i=0; i < this.undoButton.length; i++) {
			$(this.undoButton[i]).off('click').on('click', this, function(event) {
				event.data.undoCall()
			})
		}

		/** bind the click and touch event for redo*/
		for (var i=0; i < this.redoButton.length; i++) {
			$(this.redoButton[i]).off('click').on('click', this, function(event) {
				event.data.redoCall()
			})
		}

		/** bind the click and touch event for reset*/
		for (var i=0; i < this.resetButton.length; i++) {
			$(this.resetButton[i]).off('click').on('click', this, function(event) {
				event.data.resetCall()
			})
		}

		return this
	}

	/**
	 * The function to handle the undo calls
	 * @return {[type]} [description]
	 */
	undoredo.prototype.undoCall = function() {
		if (this.undo.length == 0) {
			return
		}

		var undoObj = this.undo.pop()
		undoObj.func(undoObj.args)

		if (this.undo.length == 0) {
			/** when no undo available, remove active class */
			for (var i=0; i < this.undoButton.length; i++) {
				$(this.undoButton[i]).removeClass('active')
			}
		}
	}


	/**
	 * The function to handle the redo calls
	 * @return {[type]} [description]
	 */
	undoredo.prototype.redoCall = function() {
		if (this.redo.length == 0) {
			return
		}

		var redoObj = this.redo.pop()
		redoObj.func(redoObj.args)

		if (this.redo.length == 0) {
			/** when no redo available, remove active class */
			for (var i=0; i < this.redoButton.length; i++) {
				$(this.redoButton[i]).removeClass('active')
			}
		}
	}

	/**
	 * The function to handle the reset calls
	 * @return {[type]} [description]
	 */
	undoredo.prototype.resetCall = function() {
		this.undo = []
		this.redo = []

		this.resetFunc()

		/** when no reset available, remove active class */
		for (var i=0; i < this.resetButton.length; i++) {
			$(this.resetButton[i]).removeClass('active')
		}
		/** when no undo available, remove active class */
		for (var i=0; i < this.undoButton.length; i++) {
			$(this.undoButton[i]).removeClass('active')
		}
		/** when no redo available, remove active class */
		for (var i=0; i < this.redoButton.length; i++) {
			$(this.redoButton[i]).removeClass('active')
		}
	}

	/**
	 * The function to handle a push into the undo stack
	 * @param  {Object} options The options for the undoObj
	 *                          instance: the instance of undoredo object
	 *                          recover: the function handler of the recovery processing
	 *                          redo: the function handler that this undo record generated
	 *                          args: a object includes the parameters for the recover:
	 *                          	[special property] 
	 *                          	originalArgs: the original arguments of the redo function
	 *                          	useAllArgs: when this property is set to true, the redo function
	 *                          		will get the whole args object instead of the originalArgs
	 *                          	passOptions: when it is set to true, the options of pushUndo
	 *                          		will be append as undoOptions in args. This is useful to 
	 *                          		re-push the undo object
	 * @return {[type]}         [description]
	 */
	undoredo.prototype.pushUndo = function(options) {
		options = options || {}
		var undoObj = {}
		if (!options.recover || !options.redo || !options.args) {
			return
		}
		options.args.recover = options.recover
		options.args.redo = options.redo
		/** let the redo function*/
		/** therefor, for the redo function we need to record its redo function and original arguments of that time */
		undoObj.func = function(args) {
			args.recover(args)
			/** when the isRedo is labeled, the redo array will not be cleared */
			args.originalArgs.isRedo = true
			/** push the redo when a undo called */
			if (args.useAllArgs) {
				args.instance.redo.push({
					func: args.redo,
					args: args
				})
			} else {
				args.instance.redo.push({
					func: args.redo,
					args: args.originalArgs
				})
			}
			/** enable the redo button after new redo object is pushed */
			for (var i=0; i < args.instance.redoButton.length; i++) {
				$(args.instance.redoButton[i]).addClass('active')
			}
			/** enable the reset button after new redo object is pushed */
			for (var i=0; i < args.instance.resetButton.length; i++) {
				$(args.instance.resetButton[i]).addClass('active')
			}
		}
		undoObj.args = options.args
		undoObj.args.instance = options.instance
		if (undoObj.args.passOptions) {
			undoObj.args.undoOptions = options
		}

		/** when the isRedo is not labeled, the redo array will be cleared */
		if (!options.args.originalArgs.isRedo) {
			this.redo = []

			/** redo button also need to set inactive */
			for (var i=0; i < this.redoButton.length; i++) {
				$(this.redoButton[i]).removeClass('active')
			}
		}
		this.undo.push(undoObj)
		/** enable the redo button after new undo object is pushed */
		for (var i=0; i < this.undoButton.length; i++) {
			$(this.undoButton[i]).addClass('active')
		}
		/** enable the reset button after new undo object is pushed */
		for (var i=0; i < this.resetButton.length; i++) {
			$(this.resetButton[i]).addClass('active')
		}
	}

	/**
	 * The function to replace the undo object
	 * @param  {[type]} options [description]
	 * @return {[type]}         [description]
	 */
	undoredo.prototype.replaceUndo = function(options) {
		var old_undoObj;
		options = options || {}
		if (options.undoIndex && options.undoIndex < options.instance.undo.length) {
			old_undoObj = options.instance.undo[options.undoIndex]
		} else {
			old_undoObj = options.instance.undo.pop()
		}
		if (options.redo) {
			old_undoObj.args.redo = options.redo
		}
		if (options.originalArgs) {
			old_undoObj.args.originalArgs = options.originalArgs
		}
		if (options.recover) {
			old_undoObj.args.recover = options.recover
		}
		if (options.undoIndex && options.undoIndex < options.instance.undo.length) {
			options.instance.undo[options.undoIndex] = old_undoObj
		} else {
			options.instance.undo.push(old_undoObj)
		}
	}


	
	/**
	 * The function to initialize the undoredo module
	 * @return {Object}         The object of undoredo module.
	 */
	undoredo.init = function(options) {
		return new undoredo(options)
	}

	window.undoredo = undoredo

}());