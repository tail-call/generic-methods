# generic-methods

**generic-methods** is a generic methods library for JS. It's designed
to help create composable polymorphic functions either from scratch or
by lifting from existing classes.

Other existing generic methods implementations tend to try to emulate
CLOS generic functions semantics which I don't really want (nor like),
so I wrote this.

## Usage

    $ npm install --save generic-methods

In your .js file:

    const Package = require('generic-methods');

## Rationale

Imagine you're developing a polymorphic `map()` function. Suppose you
want it to be able to map over arrays and objects and maybe even
strings. You could approach implementing such a function like this in
a vanilla JS:

    function map(collection, func) {
        if (collection instanceof Array) {
            return collection.map(func);
        } else if (typeof(collection) === 'string') {
            return collection.split('').map(func).join('');
        } else {
            let result = {};
            Object.keys(collection).forEach(key => {
                result[key] = func(collection[key]);
            });
            return result;
        }
    }

That's pretty dense, but it works. And yet it's somewhat difficult to
extend. What if next time you implement a LinkedList class and want to
map over it, too? You'd have to introduce yet another `else if` clause
in your code. After several iterations the code will simply become
unreadable.

Ideally, you could easily solve this OOP way by making every class
whose instances you want to map over implement a common interface,
say, `Mappable`. Obviously, you can't do that since Array and String
and Object are standard library classes. If you feel hacky you might
monkey patch them, but that'd be gross and could break third party
libraries.

Generic methods provide an elegant solution to this problem by
decoupling objects from actions they can perform. It's still OOP, but
methods aren't properties anymore, they exist somewhere outside of the
object and yet are dispatched as needed when needed.

This is how you'd approach the problem with **generic-methods**:

    const Package = require('generic-methods');

    const package = new Package();

    package.define('map', Array, (self, func) => {
        return self.map(func);
    });

    package.define('map', 'string', (self, func) => {
        return self.split('').map(func).join('');
    });

    package.define('map', Object, (self, func) => {
        let result = {};
        Object.keys(self).forEach(key => {
            result[key] = func(self[key]);
        });
        return result;
    });

And this is how you'd use it:

    const { map } = package.bindings;

    const twice = x => x + x;

    console.log(map([1, 2, 3], twice)); // [2, 4, 6]

    console.log(map('sausage', twice)); // 'ssaauussaaggee'

    console.log(map({ foo: 1, bar: 2 }, twice)); // { foo: 2, bar: 4 }

Extending your new `map()` to support more classes is trivial, and you
can even scope implementation of `map()` for you class within its
module, just make sure `package` is visible from there.

**generic-methods** also provides a facility for *lifting* methods
from existing classes, that is extracting them in a package as
stand-alone functions that accept class instance as a first
argument. It's ridiculously simple:

    const liftedArray = new Package('LiftedArray');

    liftedArray.lift(Array);

    // Now Array.prototype methods are available from liftedArray.bindings

    const { reverse } = liftedArray.binings;

    console.log(reverse([1, 2, 3])); // [3, 2, 1]
