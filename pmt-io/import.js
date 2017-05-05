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
    highWaterMark: opts.batchSize
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
        duration: 0,
        pkgs: []
    }

    if (options.setStats)
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

        if (options.stats.classes % options.batchSize == 0) {
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
        options.stats.pkgs.sort()
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
        element: node
    }

    options.stats.pkgs.push(pkg.name)

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

    var nameIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:name'
    })
    var localIdIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:id'
    })
    var stereotypeIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:stereotypes'
    })
    var baseClassIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:baseClassId'
    })
    var supertypesIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:supertypes'
    })
    var propertiesIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:properties'
    })

    delete node.parent;
    delete node._id

    var cls = {
        _id: id,
        parent: parentId,
        model: options.modelIdResolved,
        type: 'cls',
        name: nameIndex > -1 && node.children[nameIndex].children[0].value,
        localid: localIdIndex > -1 && node.children[localIdIndex].children[0].value,
        stereotypes: stereotypeIndex > -1 && node.children[stereotypeIndex].children.map(function(st) {
                return st.children[0].value
            }),
        baseclass: baseClassIndex > -1 && node.children[baseClassIndex].children[0].value,
        supertypes: supertypesIndex > -1 && node.children[supertypesIndex].children.map(function(st) {
                return st.children[0].value
            }),
        properties: propertiesIndex > -1 && _reduceProperties(node.children[propertiesIndex], id),
        element: node
    }


    outStream.push(cls);
}

function parseAssociation(outStream, node, options) {
    var id = node._id || options.generateId();

    var nameIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:name'
    })
    var localIdIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:id'
    })

    delete node.parent;
    delete node._id

    var asc = {
        _id: id,
        parent: options.modelIdResolved,
        model: options.modelIdResolved,
        type: 'asc',
        name: nameIndex > -1 && node.children[nameIndex].children[0].value,
        localid: localIdIndex > -1 && node.children[localIdIndex].children[0].value,
        element: node
    }

    outStream.push(asc);
}



function _reduceProperties(properties, id) {
    return properties && properties.children ? properties.children.map(function(prop) {
        let p = prop.children.reduce(function(attrs, attr) {
            let key = attr.name.substr(3);
            key = key === 'id' ? '_id' : key

            attrs[key] = attr.children && attr.children[0] ? attr.children[0].value : ''

            return attrs
        }, {});
        p.parent = id;
        p.element = prop;
        p.type = 'prp'
        return p;
    }).sort(function(a, b) {
        return a.name > b.name ? 1 : -1
    }) : null;
}