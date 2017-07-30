# Nested Scroll

Javascript library that implements [scrollIntoViewport()](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView)
for elements within nested scrollable divs.

## Usage

```javascript
  // Scroll with default options
  var target = document.getElementById('target-element');
  nestedScroll(target);

  // Scroll with additional parameters
  var options = {
    // See section options
    animationMethod: 'easeInOut',
    animationTimeout: 500,
    force: true,
    align: 'auto',
    withCssMargins: true,
    marginTop: 10,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10
  };
  nestedScroll(target, options);

  // Define a global option
  nestesScroll.defaultOptions['animationMethod'] = 'easeIn';
```

## Options

### animationMethod (default: undefined)

Values:

- 'linear': linear scrolling
- 'easeIn': start slow, end fast
- 'easeOut': start fast, end slow
- 'easeInOut': start slow, get fast and end slow
- any other or undefined: Scroll without animation

Additionally, you can provide a function that expects a parameter
value in the range of 0 to 1 (the fractional animation time)
and returns a target value between 0 and 1 (the fractional
scrolling position). An example for such a function could be Math.sqrt.

### animationTimeout (default: 500)

Animation time in milliseconds.

### force (default: false)

Scroll viewport even if the element is visible within the viewport.

### align (default: 'top left')

Up to two from the following values:

- left (scroll to left boundary)
- right (scroll to right boundary)
- top (scroll to top boundary)
- bottom (scroll to bottom boundary)

If not defined the engine selects the boundary with the shortest offset to the viewport.

### withCssMargins (default: false)

Add the elements margins and borders to its bounding rect.

### marginTop, marginLeft, marginRight, marginBottom (default: 0)

Add extra margins to the elements bounding rect

## Project status

"Works for me" ;-)

Tested in Vivaldi 1.10. Chrome 59 and Firefox 52.
If you find a bug that only occurs in another browser, please try to debug it
yourself and send a patch or pull request.

## Similar libraries

- [Smooth Scroll](https://github.com/cferdinandi/smooth-scroll) from Chris Ferdinandi
