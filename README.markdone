#VEJIS 0.4

##What is VEJIS?

VEJIS is a JavaScript framework for "grammar level" enhancing. It provides an easy way to create more powerful classes, method overloading, and modules.

##Class Enhancing

VEJIS makes it possible for a class in JavaScript to have inheritable public and private static object, of course, the class itself is inheritable. Here's an example:

    var ClassA = class_(function (pub, pri) {
        this.testA = function () {
            console.log("A - " + pub.pubTestValue + ", " + pri.priTestValue);
        };
    }).static_(function () {
        this.public_({
            pubTestValue: "pub"
        });
        this.private_({
            priTestValue: "pri old"
        });
    });

    var ClassB = class_(function (pub, pri) {
        this.testB = function () {
            console.log("B - " + pub.pubTestValue + ", " + pri.priTestValue);
        };
    }).static_({
        priTestValue: "pri new"
    }).inherit_(ClassA);

    console.log("public static value, ClassA first:");
    console.log("A - " + ClassA.pubTestValue);

    console.log("public static value, ClassB then:");
    console.log("B - " + ClassB.pubTestValue);

    var a = new ClassA();
    var b = new ClassB();

    console.log("object a first:");
    a.testA();

    console.log("object b then:");
    b.testA();
    b.testB();

Output:

	public static value, ClassA first:
	A - pub
	public static value, ClassB then:
	B - pub
	object a first:
	A - pub, pri old
	object b then:
	A - pub, pri new
	B - pub, pri new 

It's easy to find that even the private object is inherited, the modification done by the child class doesn't change the one in its parent, because they're two different objects. But at the same time, when object b uses method testA, which is inherited from ClassA, it get access to the private object of ClassB. So you can see, class inheriting in VEJIS is not just to do some copy, it makes JavaScript more efficient to deal with some large projects.

##Method Overloading

JavaScript itself has no method overloading implementation, sometimes we overload a method by length or types of arguments. VEJIS makes it easier:

    var fn = _(String, function (str) {
        console.log("string: " + str);
    });

    fn._(String, Number, function (str, num) {
        console.log("string: " + str + "\n" + "number: " + num);
    });

    fn("test");
    fn("test", 123);

And this is not all! VEJIS supports something special:

    var listFn = _(list_(Number), function (nums) {
        console.log("here're your numbers:\n" + nums.join("\n"));
    });

    listFn([123, 456, 789]);

    var paramsFn = _(params_(String), function (strs) {
        console.log("here're your strings:\n" + strs.join("\n"));
    });

    paramsFn("str 1");
    paramsFn("str 1", "str 2");
    paramsFn(["str 1", "str 2", "str 3"]);

    var optionFn = _(String, option_(Number, 123), option_(Boolean), function (str, num, bool) {
        console.log("here're your stuffs:\n" + [str, num, bool].join("\n"));
    });

    optionFn("test 1");
    optionFn("test 2", 456);
    optionFn("test 3", 456, true);

##Modules

The module system is quite simple in VEJIS. But at the same time, useful.

a.js

    module_("module-a", function () {
        this.testValue = "Module A";
    });

b.js

    require_("a.js");
    use_("module-a").module_("module-b", function (a) {
        this.testValue = "Module B is using " + a.testValue;
    });

c.js

    require_("b.js");
    use_("module-a", "module-b", function (a, b) {
        console.log(a.testValue);
        console.log(b.testValue);
    });

##Ending

As a conclusion, the reason why I developed VEJIS is to satisfy the requirements I meet when I do some JavaScript projects. VEJIS and its logic (especially of class enhancing and method overloading) to solve the problems will never fit every situation of JavaScript programming. If you have any suggestion, just let me know.

VILIC VANE
[http://www.vilic.info/](http://www.vilic.info/)