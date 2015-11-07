;(function () {
	/**
	 * The module is designed to prove some functions which used for interaction 
	 * in a patch selection task.
	 */
	
	function undoredo() {

		/** the undo function */
		this.undo = []

		/** the redo function */
		this.redo = []

		/** bind the keypress ctrl-z */
		$(window).keypress(this, function(event) {
			if (event.ctrlKey && event.which == 26) {
				event.data.undoCall()
			}
		})

		/** bind the keypress ctrl-y */
		$(window).keypress(this, function(event) {
			if (event.ctrlKey && event.which == 25) {
				event.data.redoCall()
			}
		})

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

	}

	/**
	 * The function to handle a push into the undo stack
	 * @param  {Object} options The options for the undoObj
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
		}
		undoObj.args = options.args
		undoObj.args.instance = options.instance
		if (undoObj.args.passOptions) {
			undoObj.args.undoOptions = options
		}

		/** when the isRedo is not labeled, the redo array will be cleared */
		if (!options.args.originalArgs.isRedo) {
			this.redo = []
		}
		this.undo.push(undoObj)
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
	 * The function to handle the redo calls
	 * @return {[type]} [description]
	 */
	undoredo.prototype.redoCall = function() {
		if (this.redo.length == 0) {
			return
		}

		var redoObj = this.redo.pop()
		redoObj.func(redoObj.args)
	}
	
	/**
	 * The function to initialize the undoredo module
	 * @return {Object}         The object of undoredo module.
	 */
	undoredo.init = function() {
		return new undoredo()
	}

	window.undoredo = undoredo

}());