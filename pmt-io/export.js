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
    var parent = modelId;
    var current;
    var currentId;

    var stats = {
        packages: 0,
        classes: 0,
        associations: 0,
        duration: 0,
        ids: []
    }

    if (options.setStats)
        options.setStats(stats);

    var serialWrite = function(writer, depth, doSetParent, doSetCurrent) {
        return function(elements) {
            return elements.reduce(function(pr, el) {
                updateStats(el);
                return pr.then(function() {
                    if (doSetParent)
                        parent = '' + el._id;
                    if (doSetCurrent)
                        current = el;
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
            //stats.ids.push(1);
            } else if (el.type === 'asc')
                stats.associations++;
        }
    }

    var profileToElem = function(profile, params) {
        var parameters = Object.keys(params).map(function(param) {
            return {
                name: 'sc:ProfileParameter',
                type: 'element',
                value: '',
                attributes: {
                    name: param,
                    value: params[param]
                },
                children: []
            }
        })

        var parameter = parameters.length === 0 ? [] : [{
            name: 'sc:parameter',
            type: 'element',
            value: '',
            attributes: {},
            children: parameters
        }]

        return {
            element: {
                name: 'sc:Profile',
                type: 'element',
                value: '',
                attributes: {
                    name: profile
                },
                children: parameter
            }
        }
    }

    var profilesToElem = function(profiles, profileParameters) {
        return profiles.reduce(function(elems, profile) {
            elems.push(profileToElem(profile, profileParameters[profile]));
            return elems;
        }, [])
    }

    var editableToElems = function(packages) {
        packages.forEach(function(pkg) {
            if (pkg.element.attributes.hasOwnProperty('editable') || pkg.editable === false)
                pkg.element.attributes.editable = pkg.editable === false ? 'false' : 'true'
        });

        return packages;
    }

    return Object.assign(options, {
        handlers: {
            'sc:packages': function(node, writer, depth) {
                return Promise.resolve(options.getPackages(parent))
                    .then(editableToElems)
                    .then(serialWrite(writer, depth, true));
            },
            'sc:classes': function(node, writer, depth) {
                return Promise.resolve(options.getClasses(parent))
                    .then(serialWrite(writer, depth, false, true));
            },
            'sc:associations': function(node, writer, depth) {
                return Promise.resolve(options.getAssociations(modelId))
                    .then(serialWrite(writer, depth));
            },
            'sc:id': function(node, writer, depth, next) {
                currentId = node.children[0].value;
                return next();
            },
            'sc:profiles': function(node, writer, depth) {
                var profiles = [];
                var profileParameters = {};

                if (current) {
                    if (current.localId === currentId) {
                        profiles = current.profiles;
                        profileParameters = current.profileParameters;
                    } else {
                        var prp = current.properties.find(function(prp) {
                            return prp._id === currentId
                        });
                        if (prp) {
                            profiles = prp.profiles
                            profileParameters = prp.profileParameters
                        }
                    }
                }

                return Promise.resolve(profilesToElem(profiles, profileParameters))
                    .then(serialWrite(writer, depth));
            }
        },
        stats: stats
    });
}