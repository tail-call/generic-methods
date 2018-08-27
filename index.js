// Simplistic generic method library for JS. Throw your class methods
// away!

class Method {
    constructor(name = '') {
        this.name = name;
        this.functions = new Map();
    }

    invoke(self) {
        if (typeof(self) === 'object') {
            let constructor = ((self === null)
                               ? 'null'
                               : self.constructor);
            let object = this.getImplementationFor(constructor);
            if (object) {
                return object.apply(self, arguments);
            }
        }

        let primitive = this.functions.get(typeof(self));
        if (primitive) {
            return primitive.apply(self, arguments);
        }

        throw new Error('no method implementation matches type signature of ' + self);
    }

    implement(constructor, implementation) {
        this.functions.set(constructor, implementation);
    }

    // Try to find a method definition for a class from constructor's
    // prototype chain.
    tryCachePrototypeChain(constructor) {
        let toBeCached = [];

        for (let parent = constructor;
             parent !== null;
             parent = Object.getPrototypeOf(parent))
        {
            if (this.functions.has(parent)) {
                let func = this.functions.get(parent);

                for (let cachedConstructor of toBeCached) {
                    this.implement(cachedConstructor, func);
                }

                return func;
            } else {
                toBeCached.push(parent);
            }
        }

        return this.functions.get(null) || null;
    }

    getImplementationFor(constructor) {
        if (this.functions.has(constructor)) {
            return this.functions.get(constructor);
        } else {
            return this.tryCachePrototypeChain(constructor);
        }
    }
}

class Package {
    constructor(name = '<unnamed>') {
        this.name = name;
        this.methods = Object.create(null);
    }

    define(methodName, constructor, implementation) {
        return this.methodNamed(methodName)
            .implement(constructor, implementation);
    }

    methodNamed(methodName) {
        let method = this.methods[methodName];

        if (!method) {
            method = this.methods[methodName] = new Method(methodName);
        }

        return method;
    }

    // Lifts all methods definitions from a class to current package
    lift(constructor) {
        let { prototype } = constructor;
        let descriptors = Object.getOwnPropertyDescriptors(prototype);
        for (let key in descriptors) {
            // Lifting a constructor is pretty much pointless
            if (key === 'constructor') continue;
            // Ignore symbols
            if (typeof(key) !== 'string') continue;

            let descriptor = descriptors[key];

            let implementation = descriptor.value;
            if (typeof(implementation) !== 'function') continue;

            this.define(key, constructor, function (self) {
                Array.prototype.shift.call(arguments, 1);
                return implementation.apply(self, arguments);
            });
        }
    }

    get bindings() {
        return new Proxy(this, {
            get(target, prop) {
                let method = target.methodNamed(prop);

                let func = function () {
                    return method.invoke.apply(method, arguments);
                };

                func.method = method;
                return func;
            }
        });
    }
}

module.exports = Package;
