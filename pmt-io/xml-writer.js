var Promise = require("bluebird");

module.exports = {
    create: create
};

var isSomething = function isSomething(x) {
    return x || x === 0;
};

/**
 * Escapes XML text
 * https://en.wikipedia.org/wiki/CDATA
 * @param  {string} text
 * @return {string}
 */
var escapeXmlText = function escapeXmlText(text) {
    if (isSomething(text)) {
        var str = String(text);
        return (/[&<>]/.test(str) ? '<![CDATA[' + str.replace(/]]>/, ']]]]><![CDATA[>') + ']]>' : str
        );
    }
    return '';
};

/**
 * Escapes attribute value
 * @param  {string} attribute
 * @return {string}
 */
var escapeXmlAttribute = function escapeXmlAttribute(attribute) {
    return String(attribute).replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

/**
 * Serializes an attribute value
 * @param  {string} attributes
 * @return {string}
 */
var serializeAttrs = function serializeAttrs(attributes, escapeValue, quote) {
    var result = '';
    for (var k in attributes) {
        var v = attributes[k];
        result += ' ' + k + '=' + quote + (isSomething(v) ? escapeValue ? escapeXmlAttribute(v) : v : '') + quote;
    }
    return result;
};

/**
 * @param  {XmlNode|XmlNode[]} ast
 * @return {string}
 */
var print = function print(stream, opts, ast) {
    return new Promise(function(resolve, reject) {
        if (ast.type === 'text') {
            stream.push('' + (opts.escapeText ? escapeXmlText(ast.value) : ast.value));
            resolve();
        } else {

            var attributes = serializeAttrs(ast.attributes, opts.escapeAttributes, opts.quote);
            var empty = (!ast.children || !ast.children.length) && !opts.handlers[ast.name];

            if (empty && opts.selfClose) {
                stream.push('<' + ast.name + attributes + '/>');
                resolve();
            } else {
                stream.push('<' + ast.name + attributes + '>');

                var recurse;
                if (opts.handlers[ast.name]) {
                    recurse = opts.handlers[ast.name](ast, this);
                } else {
                    recurse = ast.children.reduce(function(pr, astc) {
                        return pr.then(function() {
                            return print.call(this, stream, opts, astc);
                        }.bind(this));
                    }.bind(this), Promise.resolve());

                }

                recurse
                    .then(function() {
                        stream.push('</' + ast.name + '>');
                        resolve()
                    })
                    .catch(function(e) {
                        reject(e)
                    })
            }
        }
    }.bind(this));
};


function create(stream, options) {
    var opts = Object.assign({
        escapeAttributes: true,
        escapeText: true,
        selfClose: false,
        quote: '"',
        handlers: {}
    }, options);

    var writer = {};
    writer.print = print.bind(writer, stream, opts);

    /* {
        print: print.bind(this, stream, opts),
        on: function(tag, handler) {
            opts.handlers[tag] = handler;
        }
    }*/
    return writer;
}

