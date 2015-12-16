"use strict";

var _ = require('lodash');
var flowcheck = require('flowcheck/transform');

const FLOW_REGEX = /(:\s?\w*?)(,|\))(:\s?\w*?\s)?/g
//   // Capture a string that starts with ':' might have a space then 
//   // might have a bunch of word characters
//   (:\s?\w*?)

//   //Then it has either a ',' or a ')'
//   (,|\))

//   //Then it might have something that looks like the first line
//   (:\s?\w*?\s)?
//   `/g)

function createFn(name, params, returns, definition){
  returns = returns || 'void';

  //Create a definition that'll pass the type check
  definition = definition || `return new ${_.capitalize(returns)}().valueOf()`

  // Take an object and convert it into an array then join the array
  // into a string IE
  // {param_name: 'type'} => ['param_name', 'type'] => "param_name: type"
  let newParams = _.pairs(params).reduce(function(out, pair){
    out.push(pair.join(': '))

    return out
  }, [])

  // Doing `this` here because flowcheck blows up if you just pass function
  let src = `this.${ name } = function(${ newParams.join(', ')}): ${returns} {
    ${definition}
  }
  `
  let flowSrc = flowcheck.transform(src, {skipImport: true});

  //Remove the type annotations from the flow type
  //Basically the regex matches function(a: number, b: number) => [$1 => ': number' $2 => ',']
  //and we replace $1 (the type annotation) with $2 (the seperator)
  return flowSrc.replace(FLOW_REGEX, "$2")
}

function Client(contract) {
  // The newly returned functions
  // use _f.assert to test the params
  // passed, so we can import it here
  // and it'll be bound inside the function
  // Lexical binding for the win?
  let _f = require("flowcheck/assert");

  for(let key in contract){
    if (contract[key]['type'] == 'function'){
      let fn = createFn(key, contract[key]['params'], contract[key]['returns']);
      eval(fn);
    }
  }
}

module.exports = Client
