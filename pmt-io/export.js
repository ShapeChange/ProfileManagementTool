var through2 = require('through2');
var Promise = require("bluebird");
var xmlWriter = require('./xml-writer');

// backpressure is handled manually here, by not resolving a promise in xml-writer
// when push return value is false to pause and resuming in _read below by resolving the promise 
// 
// alternative implementation that handles backpressure automatically
// instead of pulling from the db in xml-writer for elements with a handler
// stream all elements from the db in the correct order into the xml-writer
// xml-writer would still need to know that e.g. sc:classes is the entry point for db elements of type cls

exports.createStream = function (modelId, options) {
    var writer;
    var opts = parseOptions(options, modelId);

    var toXml = through2({
        writableObjectMode: true,
        readableObjectMode: false,
        highWaterMark: 16384,
    }, function (obj, enc, cb) {
        var start;
        if (!writer) {
            start = Date.now();
            writer = xmlWriter.create(this, opts);
        }

        if (obj && obj.type) {
            profileInfosToElem(obj, opts.profiles);
            writer.print(obj).then(function () {
                opts.stats.duration = Date.now() - start;
                cb();
            });
        }
        else
            cb();
    });

    var oldRead = toXml._read;
    toXml._read = function () {
        if (writer && writer.resume) {
            //console.log('TOXML RESUME')
            writer.resume();
        }

        return oldRead.apply(toXml, arguments);
    }

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
        duration: 0
    }

    if (options.setStats)
        options.setStats(stats);

    var serialWrite = function (writer, depth, doSetParent, doSetCurrent) {
        return function (elements) {
            return elements.reduce(function (pr, el) {
                //updateStats(el);
                return pr
                    .then(function () {
                        if (doSetParent)
                            parent = '' + el._id;
                        if (doSetCurrent)
                            current = el;
                        return writer.print(el.element, depth);
                    })
                    .then(function (written) {
                        updateStats(el);
                        return written;
                    });
            }, Promise.resolve());
        }
    }

    var updateStats = function (el) {
        if (el && el.type) {
            if (el.type === 'pkg') {
                stats.packages++;
            } else if (el.type === 'cls') {
                stats.classes++;
            } else if (el.type === 'asc')
                stats.associations++;
            if (options.onStats && (el.type === 'pkg' || el.type === 'cls' || el.type === 'asc'))
                options.onStats(stats);
        }
    }

    var profileToElem = function (profile, params) {
        var parameters = params ? Object.keys(params)
            .filter(param => params[param] !== null)
            .map(function (param) {
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
            }) : []

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

    var profilesToElem = function (modelProfiles, profiles, profileParameters) {
        return profiles.reduce(function (elems, profile) {
            if (modelProfiles[profile]) {
                elems.push(profileToElem(modelProfiles[profile].name, profileParameters[profile]));
            }
            return elems;
        }, [])
    }

    var editableToElems = function (packages) {
        packages.forEach(function (pkg) {
            if (pkg.element.attributes.hasOwnProperty('editable') || pkg.editable === false)
                pkg.element.attributes.editable = pkg.editable === false ? 'false' : 'true'
        });

        return packages;
    }

    return Object.assign(options, {
        handlers: {
            'sc:packages': function (node, writer, depth) {
                return Promise.resolve(options.getPackages(parent))
                    .then(editableToElems)
                    .then(serialWrite(writer, depth, true));
            },
            'sc:classes': function (node, writer, depth) {
                return Promise.resolve(options.getClasses(parent))
                    .then(serialWrite(writer, depth, false, true));
            },
            'sc:associations': function (node, writer, depth) {
                return Promise.resolve(options.getAssociations(modelId))
                    .then(serialWrite(writer, depth));
            },
            'sc:id': function (node, writer, depth, next) {
                currentId = node.children[0].value;
                return next();
            },
            'sc:profiles': function (node, writer, depth) {
                var profiles = [];
                var profileParameters = {};

                if (current) {
                    if (current.localId === currentId) {
                        profiles = current.profiles;
                        profileParameters = current.profileParameters;
                    } else {
                        var prp = current.properties.find(function (prp) {
                            return prp._id === currentId
                        });
                        if (prp) {
                            profiles = prp.profiles
                            profileParameters = prp.profileParameters
                        }
                    }
                }

                return Promise.resolve(profilesToElem(options.profiles, profiles, profileParameters))
                    .then(serialWrite(writer, depth));
            }
        },
        ignoreCheckers: {
            'sc:profiles': function () {
                var profiles = [];
                var profileParameters = {};

                if (current) {
                    if (current.localId === currentId) {
                        profiles = current.profiles;
                        profileParameters = current.profileParameters;
                    } else {
                        var prp = current.properties.find(function (prp) {
                            return prp._id === currentId
                        });
                        if (prp) {
                            profiles = prp.profiles
                            profileParameters = prp.profileParameters
                        }
                    }
                }

                return !profiles || profiles.length == 0;
            }
        },
        stats: stats
    });
}

function profileInfosToElem(model, profilesInfo) {
    var globalProfileInfos = {
        name: 'sc:globalProfileInfos',
        type: 'element',
        value: '',
        attributes: {},
        children: Object.keys(profilesInfo).map(function (prf) {
            return profileInfoToElem(profilesInfo[prf])
        })
    }

    var i = model.children.findIndex(function (child) {
        return child.name === 'sc:globalProfileInfos'
    })

    if (i > -1) {
        model.children[i] = globalProfileInfos
    } else {
        model.children.unshift(globalProfileInfos)
    }
}

function profileInfoToElem(profile) {
    return {
        name: 'sc:Profile',
        type: 'element',
        value: '',
        attributes: {},
        children: [{
            name: 'sc:name',
            type: 'element',
            value: '',
            attributes: {},
            children: [{
                name: '',
                type: 'text',
                value: profile.name,
                attributes: {},
                children: []
            }]
        }, {
            name: 'sc:description',
            type: 'element',
            value: '',
            attributes: {},
            children: [{
                name: '',
                type: 'text',
                value: profile.description || '',
                attributes: {},
                children: []
            }]
        }]
    }
}
