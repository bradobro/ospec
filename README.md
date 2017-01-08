# ospec

[About](#about) | [Usage](#usage) | [API](#api) | [Goals](#goals)

Noiseless testing framework

Version: 1.2.3  
License: MIT

## About

- ~180 LOC
- terser and faster test code than with mocha, jasmine or tape
- test code reads like bullet points
- assertion code follows [SVO](https://en.wikipedia.org/wiki/Subject–verb–object) structure in present tense for terseness and readability
- supports:
	- test grouping
	- assertions
	- spies
	- `equals`, `notEquals`, `deepEquals` and `notDeepEquals` assertion types
	- `before`/`after`/`beforeEach`/`afterEach` hooks
	- test exclusivity (i.e. `.only`)
	- async tests and hooks
- explicitly disallows test-space configuration to encourage focus on testing, and to provide uniform test suites across projects

## Usage

### Single tests

Both tests and assertions are declared via the `o` function. Tests should have a description and a body function. A test may have one or more assertions. Assertions should appear inside a test's body function and compare two values.

```javascript
var o = require("ospec")

o("addition", function() {
	o(1 + 1).equals(2)
})
o("subtraction", function() {
	o(1 - 1).notEquals(2)
})
```

Assertions may have descriptions:

```javascript
o("addition", function() {
	o(1 + 1).equals(2)("addition should work")

	/* in ES6, the following syntax is also possible
	o(1 + 1).equals(2) `addition should work`
	*/
})
/* for a failing test, an assertion with a description outputs this:

addition should work

1 should equal 2

Error
  at stacktrace/goes/here.js:1:1
*/
```

### Grouping tests

Tests may be organized into logical groups using `o.spec`

```javascript
o.spec("math", function() {
	o("addition", function() {
		o(1 + 1).equals(2)
	})
	o("subtraction", function() {
		o(1 - 1).notEquals(2)
	})
})
```

Group names appear as a breadcrumb trail in test descriptions: `math > addition: 2 should equal 2`

### Nested test groups

Groups can be nested to further organize test groups. Note that tests cannot be nested inside other tests.

```javascript
o.spec("math", function() {
	o.spec("arithmetics", function() {
		o("addition", function() {
			o(1 + 1).equals(2)
		})
		o("subtraction", function() {
			o(1 - 1).notEquals(2)
		})
	})
})
```

### Callback test

The `o.spy()` method can be used to create a stub function that keeps track of its call count and received parameters

```javascript
//code to be tested
function call(cb, arg) {cb(arg)}

//test suite
var o = require("ospec")

o.spec("call()", function() {
	o("works", function() {
		var spy = o.spy()
		call(spy, 1)

		o(spy.callCount).equals(1)
		o(spy.args[0]).equals(1)
	})
})
```

A spy can also wrap other functions, like a decorator:

```javascript
//code to be tested
var count = 0
function inc() {
	count++
}

//test suite
var o = require("ospec")

o.spec("call()", function() {
	o("works", function() {
		var spy = o.spy(inc)
		spy()

		o(count).equals(1)
	})
})

```

### Asynchronous tests

If a test body function declares a named argument, the test is assumed to be asynchronous, and the argument is a function that must be called exactly one time to signal that the test has completed. As a matter of convention, this argument is typically named `done`.

```javascript
o("setTimeout calls callback", function(done) {
	setTimeout(done, 10)
})
```

By default, asynchronous tests time out after 20ms. This can be changed on a per-test basis using the `timeout` argument:

```javascript
o("setTimeout calls callback", function(done, timeout) {
	timeout(50) //wait 50ms before bailing out of the test

	setTimeout(done, 30)
})
```

Note that the `timeout` function call must be the first statement in its test.

Asynchronous tests generate an assertion that succeeds upon calling `done` or fails on timeout with the error message `async test timed out`.

### `before`, `after`, `beforeEach`, `afterEach` hooks

These hooks can be declared when it's necessary to setup and clean up state for a test or group of tests. The `before` and `after` hooks run once each per test group, whereas the `beforeEach` and `afterEach` hooks run for every test.

```javascript
o.spec("math", function() {
	var acc
	o.beforeEach(function() {
		acc = 0
	})

	o("addition", function() {
		acc += 1

		o(acc).equals(1)
	})
	o("subtraction", function() {
		acc -= 1

		o(acc).equals(-1)
	})
})
```

It's strongly recommended to ensure that `beforeEach` hooks always overwrite all shared variables, and avoid `if/else` logic, memoization, undo routines inside `beforeEach` hooks.

### Asynchronous hooks

Like tests, hooks can also be asynchronous. Tests that are affected by asynchronous hooks will wait for the hooks to complete before running.

```javascript
o.spec("math", function() {
	var acc
	o.beforeEach(function(done) {
		setTimeout(function() {
			acc = 0
			done()
		})
	})

	//tests only run after async hooks complete
	o("addition", function() {
		acc += 1

		o(acc).equals(1)
	})
	o("subtraction", function() {
		acc -= 1

		o(acc).equals(-1)
	})
})
```

### Running only one test

A test can be temporarily made to run exclusively by calling `o.only()` instead of `o`. This is useful when troubleshooting regressions, to zero-in on a failing test, and to avoid saturating console log w/ irrelevant debug information.

```javascript
o.spec("math", function() {
	o("addition", function() {
		o(1 + 1).equals(2)
	})

	//only this test will be run, regardless of how many groups there are
	o.only("subtraction", function() {
		o(1 - 1).notEquals(2)
	})
})
```

### Running the test suite

```javascript
//define a test
o("addition", function() {
	o(1 + 1).equals(2)
})

//run the suite
o.run()
```

### Running test suites concurrently

The `o.new()` method can be used to create new instances of ospec, which can be run in parallel. Note that each instance will report independently, and there's no aggregation of results.

```javascript
var _o = o.new()
_o("a test", function() {
	_o(1).equals(1)
})
_o.run()
```

### Running the test suite from the command-line

ospec will automatically evaluate all `*.js` files in any folder named `/tests`.

`o.run()` is automatically called by the cli - no need to call it in your test code.

#### Create an npm script in your package:
```
	"scripts": {
		...
		"test": "ospec",
		...
	}
```

```
	$ npm test
```

#### Installing ospec globally

While it's recommended to install ospec locally to maintain reproducible environments, sometimes it may be deemed appropriate to install it globally. To do so, run this command:

```
npm install ospec -g
```

---

## API

Square brackets denote optional arguments

### void o.spec(String title, Function tests)

Defines a group of tests. Groups are optional

---

### void o(String title, Function([Function done [, Function timeout]]) assertions)

Defines a test.

If an argument is defined for the `assertions` function, the test is deemed to be asynchronous, and the argument is required to be called exactly one time.

---

### Assertion o(any value)

Starts an assertion. There are four types of assertion: `equals`, `notEquals`, `deepEquals` and `notDeepEquals`.

Assertions have this form:

```
o(actualValue).equals(expectedValue)
```

As a matter of convention, the actual value should be the first argument and the expected value should be the second argument in an assertion.

Assertions can also accept an optional description curried parameter:

```
o(actualValue).equals(expectedValue)("this is a description for this assertion")
```

Assertion descriptions can be simplified using ES6 tagged template string syntax:

```
o(actualValue).equals(expectedValue) `this is a description for this assertion`
```

#### Function(String description) o(any value).equals(any value)

Asserts that two values are strictly equal (`===`)

#### Function(String description) o(any value).notEquals(any value)

Asserts that two values are strictly not equal (`!==`)

#### Function(String description) o(any value).deepEquals(any value)

Asserts that two values are recursively equal

#### Function(String description) o(any value).notDeepEquals(any value)

Asserts that two values are not recursively equal

---

### void o.before(Function([Function done [, Function timeout]]) setup)

Defines code to be run at the beginning of a test group

If an argument is defined for the `setup` function, this hook is deemed to be asynchronous, and the argument is required to be called exactly one time.

---

### void o.after(Function([Function done [, Function timeout]]) teardown)

Defines code to be run at the end of a test group

If an argument is defined for the `teardown` function, this hook is deemed to be asynchronous, and the argument is required to be called exactly one time.

---

### void o.beforeEach(Function([Function done [, Function timeout]]) setup)

Defines code to be run before each test in a group

If an argument is defined for the `setup` function, this hook is deemed to be asynchronous, and the argument is required to be called exactly one time.

---

### void o.afterEach(Function([Function done [, Function timeout]]) teardown)

Defines code to be run after each test in a group

If an argument is defined for the `teardown` function, this hook is deemed to be asynchronous, and the argument is required to be called exactly one time.

---

### void o.only(String title, Function([Function done [, Function timeout]]) assertions)

Declares that only a single test should be run, instead of all of them

---

### Function o.spy([Function fn])

Returns a function that records the number of times it gets called, and its arguments

#### Number o.spy().callCount

The number of times the function has been called

#### Array<any> o.spy().args

The arguments that were passed to the function in the last time it was called

---

### void o.run()

Runs the test suite

---

### Function o.new()

Returns a new instance of ospec. Useful if you want to run more than one test suite concurrently

```javascript
var $o = o.new()
$o("a test", function() {
	$o(1).equals(1)
})
$o.run()
```

---

## Goals

- Do the most common things that the mocha/chai/sinon triad does without having to install 3 different libraries and several dozen dependencies
- Disallow configuration in test-space:
	- Disallow ability to pick between API styles (BDD/TDD/Qunit, assert/should/expect, etc)
	- Disallow ability to pick between different reporters
	- Disallow ability to add custom assertion types
- Make assertion code terse, readable and self-descriptive
- Have as few assertion types as possible for a workable usage pattern

Explicitly disallowing modularity and configuration in test-space has a few benefits:

- tests always look the same, even across different projects and teams
- single source of documentation for entire testing API
- no need to hunt down plugins to figure out what they do, especially if they replace common javascript idioms with fuzzy spoken language constructs (e.g. what does `.is()` do?)
- no need to pollute project-space with ad-hoc configuration code
- discourages side-tracking and yak-shaving
