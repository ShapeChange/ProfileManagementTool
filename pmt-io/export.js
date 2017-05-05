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
        this.push('<?xml version="1.0" encoding="UTF-8"?>')
    }

    if (obj && obj.type) {
        writer.print(obj).then(function() {
            opts.stats.duration = Date.now() - start;
            opts.stats.pkgs.sort()
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
        pkgs: []
    }

    if (options.setStats)
        options.setStats(stats);

    var serialWrite = function(writer, doNotSetCurrent) {
        return function(elements) {
            return elements.reduce(function(pr, el) {
                updateStats(el);
                return pr.then(function() {
                    if (!doNotSetCurrent)
                        current = '' + el._id;
                    return writer.print(el.element);
                });
            }, Promise.resolve());
        }
    }

    var updateStats = function(el) {
        if (el && el.type) {
            if (el.type === 'pkg') {
                stats.packages++;
                stats.pkgs.push(el.name);
            } else if (el.type === 'cls')
                stats.classes++;
            else if (el.type === 'asc')
                stats.associations++;
        }
    }

    return {
        handlers: {
            'sc:packages': function(node, writer) {
                return Promise.resolve(options.getPackages(current))
                    .then(serialWrite(writer));
            },
            'sc:classes': function(node, writer) {
                return Promise.resolve(options.getClasses(current))
                    .then(serialWrite(writer));
            },
            'sc:associations': function(node, writer) {
                return Promise.resolve(options.getAssociations(modelId))
                    .then(serialWrite(writer, true));
            }
        },
        stats: stats
    };
}