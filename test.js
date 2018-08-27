const { expect } = require('chai');

const Package = require('./index.js');

describe('Package', () => {
    it('should define multiple method implementations', () => {
        const pkg = new Package('anonymous');

        pkg.define('reverse', Array, self => {
            return self.reverse();
        });

        pkg.define('reverse', 'string', self => {
            return self.split('').reverse().join('');
        });

        pkg.define('reverse', 'number', self => {
            return 1 / self;
        });

        pkg.define('reverse', 'null', self => {
            return true;
        });

        pkg.define('reverse', null, self => {
            return 'default implementation invoked';
        });

        const { reverse } = pkg.bindings;

        expect(reverse([1, 2, 3])).to.deep.equal([3, 2, 1]);
        expect(reverse('hello world')).to.equal('dlrow olleh');
        expect(reverse(2)).to.be.within(0.499, 0.501);
        expect(reverse(null)).to.equal(true);
        expect(reverse({})).to.equal('default implementation invoked');
    });

    it('should lift methods from Array class', () => {
        const pkg = new Package('Array');

        pkg.lift(Array);

        const { map, reduce } = pkg.bindings;

        let mapped = map([1, 2, 3], x => x * x);
        expect(mapped).to.deep.equal([1, 4, 9]);

        let reduced = reduce(mapped, (a, x) => a + x);
        expect(reduced).to.equal(14);
    });

    it('should apply methods of a parent class to child instances', () => {
        const pkg = new Package('ABC');

        class A {
            frobnicate() {
                return 'frobnicated';
            }
        }

        class B extends A {}
        class C extends B {}

        pkg.lift(A);
        pkg.define('fiddle', A, self => 'fiddled');

        const { frobnicate, fiddle } = pkg.bindings;

        expect(frobnicate(new C)).to.equal('frobnicated');
        expect(fiddle(new C)).to.equal('fiddled');
    });

    it('should be able to export a single method', () => {
        const pkg = new Package('MethodTest');

        const { foo } = pkg.bindings;

        expect(foo).to.have.property('method');

        // Nothing defined yet
        expect(() => foo()).to.throw();

        foo.method.implement('number', self => {
            return 'ch' + 'e'.repeat(self) + 'se';
        });

        expect(foo(2)).to.equal('cheese');
    });
});
