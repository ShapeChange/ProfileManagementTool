var through2 = require('through2');
var multipipe = require('multipipe');
var xmlDecoder = require('read-xml');
var xmlLexer = require('xml-lexer');
var xmlParser = require('xml-reader');

exports.createStream = function(modelName, options) {
var xmlTransformer;
var opts = parseOptions(options, modelName);

var attrName;
var lexer = xmlLexer.create();
lexer.on('data', function(data) {
    if (!opts.nsPrefix) {
        if (data.type === 'attribute-name') {
            attrName = data.value;
        } else if (data.type === 'attribute-value' && data.value === 'http://shapechange.net/model') {
            opts.nsPrefix = attrName.substr(6) + ':';
        }
    }
});

var toObjects = through2({
    readableObjectMode: true,
    highWaterMark: 1 //opts.batchSize
}, function(chunkBuf, enc, cb) {
    var chunk = chunkBuf.toString();
    if (!opts.nsPrefix)
        lexer.write(chunk);

    if (!xmlTransformer)
        xmlTransformer = createXmlTransformer(this, opts);

    xmlTransformer.parse(chunk);

    cb();
})

var toUtf = xmlDecoder.createStream();

return multipipe(toUtf, toObjects)
};

function parseOptions(options, modelName) {
    var i = 1;

    var stats = {
        packages: 0,
        classes: 0,
        associations: 0,
        properties: 0,
        maxMemory: 0,
        duration: 0
    }

    if (options && options.setStats)
        options.setStats(stats);

    var opts = Object.assign({
        batchSize: 5,
        generateId: function() {
            return i++;
        },
        resolveId: function(id) {
            return id;
        },
        modelName: modelName,
        nsPrefix: '',
        stats: stats
    }, options);

    opts.modelId = opts.generateId();
    opts.modelIdResolved = opts.resolveId(opts.modelId);
    stats.model = opts.modelIdResolved;

    return opts;
}


function createXmlTransformer(outStream, options) {

    var profiles = []
    var profile = []

    var tags = {
        Model: null,
        Profile: null,
        Package: null,
        Class: null,
        Property: null,
        Association: null,
        packages: null,
        classes: null,
        associations: null
    }

    for (var key in tags) {
        tags[key] = 'tag:' + options.nsPrefix + key
    }


    var xmlStream = xmlParser.create({
        stream: false,
        parentNodes: true
    });



    xmlStream.on(tags.Profile, function(profile) {
        //console.log(profile);

        if (profiles.indexOf(profile.attributes.name) === -1) {
            profiles.push(profile.attributes.name);
        }
    });

    xmlStream.on(tags.Model, function(node) {
        parseModel(outStream, node, options, profiles);
    });

    xmlStream.on(tags.Package, function(node) {
        parsePackage(outStream, node, options);

        options.stats.packages++;
    });

    xmlStream.on(tags.Class, function(node) {
        parseClass(outStream, node, options);

        options.stats.classes++;

        if (options.stats.classes % 8 == 0) {
            console.log(options.stats.classes + ': ' + process.memoryUsage().heapUsed);

            options.stats.maxMemory = Math.max(options.stats.maxMemory, process.memoryUsage().heapUsed)
        }
    });

    xmlStream.on(tags.Property, function(node) {
        options.stats.properties++;
    });

    xmlStream.on(tags.Association, function(node) {
        parseAssociation(outStream, node, options);

        options.stats.associations++;

        if (options.stats.associations % 8 == 0) {
            console.log(options.stats.associations + ': ' + process.memoryUsage().heapUsed);

            options.stats.maxMemory = Math.max(options.stats.maxMemory, process.memoryUsage().heapUsed)
        }
    });

    // split here, free memory
    xmlStream.on(tags.packages, function(node) {
        node.children = [];
    });

    // split here, free memory
    xmlStream.on(tags.classes, function(node) {
        node.children = [];
    });

    // split here, free memory
    xmlStream.on(tags.associations, function(node) {
        node.children = [];
    });

    // cleanup parent references, is called after specific tag events
    xmlStream.on('tag', function(name, node) {
        delete node.parent;
        for (var i = 0; i < node.children.length; i++) {
            if (node.children[i])
                delete node.children[i].parent;
        }
    });


    var start = Date.now();

    xmlStream.on("done", function(data) {
        outStream.end();

        options.stats.duration = Date.now() - start;
    })

    return xmlStream;
}



function parseModel(outStream, node, options, profiles) {
    var model = {
        _id: options.modelId,
        name: options.modelName,
        type: 'mdl',
        owner: 'unknown',
        created: Date.now(),
        profiles: profiles,
        profiles2: profiles.reduce(function(obj, prf) {
            obj[prf] = {
                _id: prf,
                name: prf,
                errors: []
            }
            return obj
        }, {}),
        element: node
    }

    if (model.element.attributes.encoding) {
        model.element.attributes.encoding = 'UTF-8';
    }

    outStream.push(model);
}

function parseProfile(outStream, node) {

}

function parsePackage(outStream, node, options) {
    var parent;
    var current = node.parent;

    while (current !== null) {
        if (current.name === 'sc:Package') {
            if (!current['_id'])
                current._id = options.generateId();
            if (!parent)
                parent = current;
        }
        current = current.parent;
    }

    var id = node._id || options.generateId();
    var parentId = parent && parent['_id'] ? options.resolveId(parent['_id']) : options.modelIdResolved

    delete node.parent;
    delete node._id

    var pkg = {
        _id: id,
        parent: parentId,
        model: options.modelIdResolved,
        type: 'pkg',
        name: node.children[0].children[0].value,
        editable: node.attributes.editable === 'false' ? false : true,
        element: node
    }

    outStream.push(pkg);
}

function parseClass(outStream, node, options) {
    var parent;
    var current = node.parent;

    while (current !== null) {
        if (current.name === 'sc:Package') {
            if (!current['_id'])
                current._id = options.generateId();
            if (!parent)
                parent = current;
            break;
        }
        current = current.parent;
    }

    var id = node._id || options.generateId();
    var parentId = parent && parent['_id'] ? options.resolveId(parent['_id']) : null
    var editable = parent && parent.attributes && parent.attributes.editable === 'false' ? false : true

    delete node.parent;
    delete node._id

    var attributes = reduceNode(node, options.resolveId(id));

    var cls = Object.assign(attributes, {
        _id: id,
        parent: parentId,
        model: options.modelIdResolved,
        type: 'cls',
        editable: editable,
        element: node
    });

    outStream.push(cls);
}

function parseAssociation(outStream, node, options) {
    var id = node._id || options.generateId();

    delete node.parent;
    delete node._id

    var attributes = reduceNode(node, null, 'asc');

    var asc = Object.assign(attributes, {
        _id: id,
        parent: options.modelIdResolved,
        model: options.modelIdResolved,
        type: 'asc',
        element: node
    });

    outStream.push(asc);
}

// TODO: omit non-relevant for type
function reduceNode(node, id, type) {
    var nameIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:name'
    })
    var localIdIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:id'
    })
    var stereotypeIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:stereotypes'
    })
    var descriptorsIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:descriptors'
    })
    var taggedValuesIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:taggedValues'
    })
    var baseClassIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:baseClassId'
    })
    var supertypesIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:supertypes'
    })
    var profilesIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:profiles'
    })
    var cardinalityIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:cardinality'
    })
    var isAttributeIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:isAttribute'
    })
    var typeIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:typeId'
    })
    var typeNameIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:typeName'
    })
    var associationIdIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:associationId'
    })
    var propertiesIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:properties'
    })

    if (profilesIndex === -1 && type !== 'asc') {
        node.children.push({
            name: 'sc:profiles',
            type: 'element',
            value: '',
            attributes: {},
            children: []
        })
    }

    return {
        name: nameIndex > -1 && node.children[nameIndex].children[0].value,
        localId: localIdIndex > -1 && node.children[localIdIndex].children[0].value,
        descriptors: descriptorsIndex > -1 && node.children[descriptorsIndex].children.reduce((attrs, attr) => {
                let key = attr.name.substr(3);
                let value = attr.children && attr.children[0] && attr.children[0].children[0] && attr.children[0].children[0].children[0] ? attr.children[0].children[0].children[0].value : ''

                if (key && value && value !== '')
                    attrs[key] = value

                return attrs
            }, {}),
        taggedValues: taggedValuesIndex > -1 && node.children[taggedValuesIndex].children.reduce((attrs, attr) => {
                let key = attr.children && attr.children[0] && attr.children[0].children[0] ? attr.children[0].children[0].value : null
                let value = key && attr.children[1] && attr.children[1].children[0] ? attr.children[1].children[0].children[0].value : ''
                if (key && key !== 'profiles' && key !== 'sequenceNumber' && value && value !== '')
                    attrs[key] = value

                return attrs
            }, {}),
        stereotypes: stereotypeIndex > -1 && node.children[stereotypeIndex].children.map(function(st) {
                return st.children[0].value
            }),
        baseclass: baseClassIndex > -1 && node.children[baseClassIndex].children[0].value,
        supertypes: supertypesIndex > -1 ? node.children[supertypesIndex].children.map(function(st) {
            return st.children[0].value
        }) : [],
        profiles: profilesIndex > -1 ? node.children[profilesIndex].children.map(function(pr) {
            return pr.attributes.name;
        }) : [],
        profileParameters: profilesIndex > -1 ? _reduceProfiles(node.children[profilesIndex]) : {},
        cardinality: cardinalityIndex > -1 && node.children[cardinalityIndex].children[0].value,
        isAttribute: isAttributeIndex > -1 && node.children[isAttributeIndex].children[0].value,
        optional: cardinalityIndex > -1 && node.children[cardinalityIndex].children[0].value && node.children[cardinalityIndex].children[0].value.indexOf('0') === 0,
        typeId: typeIndex > -1 && node.children[typeIndex].children[0].value,
        typeName: typeNameIndex > -1 && node.children[typeNameIndex].children[0].value,
        associationId: associationIdIndex > -1 && node.children[associationIdIndex].children[0].value,
        properties: propertiesIndex > -1 ? _reduceProperties(node.children[propertiesIndex], node.children[localIdIndex].children[0].value) : []
    }
}


function _reduceProperties(properties, id) {
    return properties.children.map(function(prop) {
        let p = reduceNode(prop);

        p.parent = id;
        p._id = p.localId;
        p.element = prop;
        p.type = 'prp';
        p.cardinality = p.cardinality || '1..1'

        return p;
    }).sort(function(a, b) {
        return a.name > b.name ? 1 : -1
    });
}

function _reduceProfiles(profiles) {
    return profiles.children.reduce(function(reduced, profile) {
        var parameter = {};
        if (profile.children.length) {
            profile.children[0].children.reduce(function(params, param) {
                params[param.attributes.name] = param.attributes.value;
                return params;
            }, parameter)
        }

        reduced[profile.attributes.name] = parameter;

        return reduced;
    }, {});
}