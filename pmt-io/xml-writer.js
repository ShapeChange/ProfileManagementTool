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

var indent = function indent(stream, opts, depth) {
    if (opts.pretty) {
        stream.push('\n' + Array(depth).fill(opts.tab).join(''));
    }
}

var writer = {
    print: null,
    resume: null
};

/**
 * @param  {XmlNode|XmlNode[]} ast
 * @return {string}
 */
var print = function print(stream, opts, ast, depth) {
    var depth = depth || 0;

    if (depth === 0)
        stream.push('<?xml version="1.0" encoding="UTF-8"?>');

    return new Promise(function(resolve, reject) {
        if (ast.type === 'text') {
            stream.push('' + (opts.escapeText ? escapeXmlText(ast.value) : ast.value));
            resolve(true);
        } else {

            var attributes = serializeAttrs(ast.attributes, opts.escapeAttributes, opts.quote);
            var empty = (!ast.children || !ast.children.length) && !opts.handlers[ast.name];

            if (empty && opts.selfClose) {
                indent(stream, opts, depth);
                stream.push('<' + ast.name + attributes + '/>');
                resolve();
            } else {
                indent(stream, opts, depth);

                stream.push('<' + ast.name + attributes + '>');

                var recurse;
                var next = function() {
                    return ast.children.reduce(function(pr, astc) {
                        return pr.then(function() {
                            return print.call(this, stream, opts, astc, depth + 1);
                        }.bind(this));
                    }.bind(this), Promise.resolve());
                }.bind(this)

                if (opts.handlers[ast.name]) {
                    recurse = opts.handlers[ast.name](ast, this, depth + 1, next);
                } else {
                    recurse = next();
                }

                recurse
                    .then(function(noIndent) {
                        !noIndent && indent(stream, opts, depth);

                        var pause = !stream.push('</' + ast.name + '>');

                        if (depth === 0)
                            stream.push('\n');

                        if (pause) {
                            //console.log('PAUSE WRITER')
                            writer.resume = function() {
                                //console.log('RESUME WRITER')
                                writer.resume = null;
                                resolve();
                            }
                        } else
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
        escapeText: false,
        selfClose: false,
        quote: '"',
        tab: '\t',
        pretty: false,
        handlers: {}
    }, options);

    writer.print = print.bind(writer, stream, opts);

    return writer;
}

