var rewire = require("rewire");
var expect = require("chai").expect;
var app = rewire('../dynamic-compile.js')

describe('FLOW_REGEX', function(){
  var FLOW_REGEX = app.__get__('FLOW_REGEX')

  it('should match single params', function(){
    expect("function(a: number)".replace(FLOW_REGEX, '$2')).to.equal("function(a)")
  })

  it('should match multiple params', function(){
    expect("function(a: number, b: number)".replace(FLOW_REGEX, '$2')).to.equal("function(a, b)")
  })

  it('should match functions with a return type', function(){
    expect("function(a: number): number { }".replace(FLOW_REGEX, '$2')).to.equal("function(a){ }")
  })

  it('will fail if the function has a retrun type but no definition {}', function(){
    expect("function(a: number): number".replace(FLOW_REGEX, '$2')).to.equal("function(a)number")
  })
});

describe('Client', function(){
  var contract = {
    add: {
      type: 'function',
      params: {
        a: 'number',
        b: 'number'
      },
      returns: 'number'
    }
  };

  var Client = app.__get__('Client')

  it('should define the function defined in the contract', function(){
    expect(new Client(contract)).to.respondTo('add')
  })

  it('should not throw an exception if the method call conforms to the contract', function(){
    var boundFn = new Client(contract).add.bind(this, 1, 2);

    expect(boundFn).not.to.throw()
  })

  it('should throw an exception if the method call doesnt conform to the contract', function(){
    // Apparently Mocha doesn't can't test a function with certain params,
    // and since you can't call the function in the expect (it'll crash before the test)
    // I return a function with the params bound so mocha can call it
    var boundFn = new Client(contract).add.bind(this, 1, 'fail');

    expect(boundFn).to.throw(TypeError)
  })
})

describe('createFn', function(){
  var createFn = app.__get__('createFn');

  it('should return a string function that matches the defintion', function(){
    var output = `this.add = function(a){_f.check(arguments, _f.arguments([_f.number])); var ret = (function (a) {
    return a + b
  }).apply(this, arguments); return _f.check(ret, _f.number);}
  `

    expect(createFn('add', {a: 'number'}, 'number', "return a + b")).to.equal(output)
  })
})
