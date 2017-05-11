var through2 = require('through2');
var Promise = require("bluebird");
var xmlWriter = require('./xml-writer');

exports.createStream = function(modelId, options) {
var writer;
var opts = parseOptions(options, modelId);

var toXml = through2.obj(function(obj, enc, cb) {
    var start;
    if (!writer) {
        start = Date.now();
        writer = xmlWriter.create(this, opts);
    }

    if (obj && obj.type) {
        writer.print(obj).then(function() {
            opts.stats.duration = Date.now() - start;
            cb();
        });
    }
    else
        cb();
});

return toXml;
}

function parseOptions(options, modelId) {
    var current = modelId;

    var stats = {
        packages: 0,
        classes: 0,
        associations: 0,
        duration: 0,
        ids: []
    }

    if (options.setStats)
        options.setStats(stats);

    var serialWrite = function(writer, depth, doSetCurrent) {
        return function(elements) {
            return elements.reduce(function(pr, el) {
                updateStats(el);
                return pr.then(function() {
                    if (doSetCurrent)
                        current = '' + el._id;
                    return writer.print(el.element, depth);
                });
            }, Promise.resolve());
        }
    }

    var updateStats = function(el) {
        if (el && el.type) {
            if (el.type === 'pkg') {
                stats.packages++;
            } else if (el.type === 'cls') {
                stats.classes++;
                stats.ids.push(1);
            } else if (el.type === 'asc')
                stats.associations++;
        }
    }

    return Object.assign(options, {
        handlers: {
            'sc:packages': function(node, writer, depth) {
                return Promise.resolve(options.getPackages(current))
                    .then(serialWrite(writer, depth, true));
            },
            'sc:classes': function(node, writer, depth) {
                return Promise.resolve(options.getClasses(current))
                    .then(serialWrite(writer, depth));
            },
            'sc:associations': function(node, writer, depth) {
                return Promise.resolve(options.getAssociations(modelId))
                    .then(serialWrite(writer, depth));
            }
        },
        stats: stats
    });
}