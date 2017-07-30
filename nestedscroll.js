/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017, Roland  Tapken.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 **/
(function (root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		define([], factory(root));
	} else if (typeof module !== 'undefined' && module.export) {
		module.exports = factory(root);
	} else {
		root.nestedScroll = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {
	"use strict"; 

	/**
	 * Default options
	 **/
	var defaultOptions = {
		easingMethod: undefined,
		easingTimeout: 500
	};

	// Local shortcuts
	var min = Math.min,
		max = Math.max;

	/**
	 * Returns a DOMRect compatible object
	 */
	function Rect(x, y, width, height) {
		return {
			left: x,
			top: y,
			width: width,
			height: height,
			right: x + width,
			bottom: y + height
		};
	}

	function isFunction(functionToCheck) {
		// https://stackoverflow.com/questions/5999998/how-can-i-check-if-a-javascript-variable-is-function-type
		var getType = {};
		return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
	}

	/**
	 * Available easing algorithms. The algorithems get an argument
	 * between 0..1 and must return a result value between 0..1.
	 **/
	var easingAlgorithms = {
		linear: function(linearPos) {
			return linearPos;
		},

		easeInOut: function(linearPos) {
			if (linearPos < 1) {
				return 0.5 * (1+Math.cos(Math.PI + linearPos * Math.PI));
			} else {
				return 1.0;
			}
		},

		easeIn: function(linearPos) {
			if (linearPos < 1) {
				return (1+Math.cos(Math.PI + linearPos * 0.5*Math.PI));
			} else {
				return 1.0;
			}
		},

		easeOut: function(linearPos) {
			if (linearPos < 1) {
				return Math.sin(linearPos * 0.5*Math.PI);
			} else {
				return 1.0;
			}
		}
	};

	/**
	 * Implement the scrolling. If this is implemented asynchronously
	 * the function has to monitor 'this.abort' and stop scrolling
	 * immediatly if this becomes true.
	 */
	var defaultScrollHelper = function(target, left, top) {
		if (!this.abort) {
			target.scrollLeft += left;
			target.scrollTop += top;
		}
	};

	var easingScrollHelper = function(target, left, top, easingAlgorithm, timeout) {
		var start;
		var signX = left < 0 ? -1 : 1;
		var signY = left < 0 ? -1 : 1;
		left = Math.abs(left);
		top = Math.abs(top);
		var _this = this;

		var sourceX = target.scrollLeft;
		var sourceY = target.scrollTop;

		function step(timestamp) {
			if (_this.abort) {
				return;
			}
			if (start === undefined) {
				start = timestamp;
			}

			// Get relative position to timeout
			if ((timestamp - start) < timeout) {
				var pos = easingAlgorithm((timestamp - start)/timeout);
				var deltaX = Math.round(min(left, left*pos));
				var deltaY = Math.round(min(top, top*pos));
				target.scrollLeft = sourceX + signX*deltaX;
				target.scrollTop  = sourceY + signY*deltaY;
				window.requestAnimationFrame(step);
			} else {
				target.scrollLeft = sourceX + signX*left;
				target.scrollTop  = sourceY + signY*top;
			}
		}
		window.requestAnimationFrame(step);
	};

	/**
	 * Chooses a scroll helper from this.options.easing.
	 **/
	var scrollHelper = function(target, left, top) {
		var easingMethod = this.options['easingMethod'];
		var easingTimeout = parseInt(this.options['easingTimeout']);
		if (easingMethod && !isNaN(easingTimeout) && easingTimeout > 0) {
			if (isFunction(easingMethod)) {
				return easingScrollHelper.call(this, target, left, top, easingMethod, easingTimeout);
			} else {
				var easingAlgorithm = easingAlgorithms[easingMethod];
				if (easingAlgorithm !== undefined) {
					return easingScrollHelper.call(this, target, left, top, easingAlgorithm, easingTimeout);
				}
			}
		}
		return defaultScrollHelper.call(this, target, left, top);
	};

	/**
	 * Merge option objects
	 **/
	var mergeObjects = function() {
		var r = {};
		for (var i = 0; i < arguments.length; i+=1) {
			var arg = arguments[i];
			if (typeof arg === 'object') {
				for (var k in arg) {
					if (arg.hasOwnProperty(k)) {
						r[k] = arg[k];
					}
				}
			}
		}
		return r;
	};


	/**
	 * Returns true if the element should have scrollbars
	 **/
	var hasScrollbar = function(element, computedStyle) {
		if (element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight) {
			computedStyle = computedStyle || window.getComputedStyle(element);
			if (computedStyle.getPropertyValue('overflow') !== 'hidden') {
				return true;
			}
		}
		return false;
	};

	/**
	 * Returns the relative bounding rect between the target and
	 * the container element. The container *must* be a parent
	 * element of target.
	 **/
	var getRelativeBoundingRect = function(target, container) {
		var tRect = target.getBoundingClientRect();
		var cRect;
		if (container === document.scrollingElement) {
			cRect = new Rect(0, 0, container.clientWidth, container.clientHeight);
		} else {
			cRect = container.getBoundingClientRect();
		}
		
		return new Rect(
			tRect.left - cRect.left,
			tRect.top - cRect.top,
			tRect.right - cRect.left,
			tRect.bottom - cRect.top
		);
	};

	/**
	 * Locates the nearest scrollable parent element. If the
	 * element doesn't have a scrollable parent  (either because
	 * no scrollbars are visible, or the element is a child
	 * of an element with style 'position: fixed') this function
	 * returns undefined.
	 **/
	var findScrollableParent = function(element) {
		if (element === document.scrollingElement) {
			// This is either body or html. Don't go further.
			return;
		}

		var computedStyle = window.getComputedStyle(element);
		while (computedStyle.getPropertyValue('position') !== 'fixed' && element.parentElement) {
			element = element.parentElement;
			computedStyle = window.getComputedStyle(element);
			if (hasScrollbar(element, computedStyle)) {
				return element;
			}
		}
		return undefined;
	};

	var currentScrollMonitor;
	var scrollIntoViewport = function(element, options) {
		options = mergeObjects(defaultOptions, options);

		// Stop running scroll process
		if (currentScrollMonitor !== undefined) {
			currentScrollMonitor.abort = true;
		}
		currentScrollMonitor = { abort: false, options: options };

		var scrollable = findScrollableParent(element);
		var scrollings = [];
		var totalOffsetLeft = 0,
			totalOffsetTop = 0;
		while (scrollable) {
			var rect = getRelativeBoundingRect(element, scrollable);
			rect.left -= totalOffsetLeft;
			rect.top -= totalOffsetTop;

			var maxLeft = scrollable.scrollWidth - scrollable.clientWidth;
			var maxTop = scrollable.scrollHeight - scrollable.clientHeight;

			var offsetLeft = min(maxLeft, max(0, scrollable.scrollLeft + rect.left)) - scrollable.scrollLeft;
			var offsetTop = min(maxTop, max(0, scrollable.scrollTop + rect.top)) - scrollable.scrollTop;

			totalOffsetLeft += offsetLeft;
			totalOffsetTop += offsetTop;
			scrollings.push([scrollable, offsetLeft, offsetTop]);

			scrollable = findScrollableParent(scrollable);
		}

		// Invoke scroll tasks. This is done asynchonously to allow effects like easing.
		for (var i = 0; i < scrollings.length; i+=1) {
			scrollHelper.apply(currentScrollMonitor, scrollings[i]);
		}
	};

	return {
		scrollIntoViewport: scrollIntoViewport,
		defaultOptions: defaultOptions
	};


});
