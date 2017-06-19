var Promise = require("bluebird");

var classes = {
    1: {
        name: 'CLASS',
        localId: '1',
        properties: [
            {
                name: 'PROP1',
                optional: false,
                typeId: '2',
                _id: '1_1',
                profiles: ['A'],
                cardinality: '1..*',
                profileParameters: {
                    A: {
                        multiplicity: '0..*',
                        isNavigable: 'true'
                    }
                },
                isAttribute: true
            },
            {
                name: 'PROP2',
                optional: true,
                typeId: '5',
                _id: '1_2',
                profiles: ['C'],
                cardinality: '1..*',
                profileParameters: {
                    C: {
                        multiplicity: '1..1'
                    }
                }
            }
        ],
        profiles: ['A', 'B'],
        editable: true
    },
    2: {
        name: 'TYPE',
        localId: '2',
        properties: [],
        profiles: ['B'],
        editable: true
    },
    5: {
        name: 'TYPE_OPTIONAL',
        localId: '5',
        properties: [],
        profiles: [],
        editable: false
    },
    3: {
        name: 'SUPER_CLASS',
        localId: '3',
        properties: [],
        profiles: ['A', 'C'],
        editable: true
    },
    6: {
        name: 'SUPER_CLASS_NON_EDITABLE',
        localId: '6',
        properties: [],
        profiles: ['A', 'C'],
        editable: false
    },
    4: {
        name: 'SUB_CLASS',
        localId: '4',
        properties: [],
        editable: true
    }
}

function getTypeIdForProperty(clsId, prpId) {
    var prp = classes[clsId].properties.find(function(prp) {
        return prp._id === prpId
    })

    return prp.typeId;
}

var modelReader = {
    getClass: function(clsId, modelId, projection, filter) {
        if (filter && filter.editable && filter.editable === true && !classes[clsId].editable) {
            return Promise.resolve(null);
        }
        return Promise.resolve(classes[clsId]);
    },
    getClassGraph: function(clsId, modelId, subNotSuper, projection, filter) {
        var graph = [classes[clsId]];

        if (clsId === '1') {
            if (subNotSuper) {
                graph.push(classes['4'])
            } else {
                graph.push(classes['3'])
                graph.push(classes['6'])
            }
        }
        if (filter && filter.profiles && filter.profiles.$not && filter.profiles.$not.$all) {
            graph = graph.filter(function(cls) {
                return !filter.profiles.$not.$all.every(function(prf) {
                    return cls.profiles.indexOf(prf) > -1
                })
            })
        }
        if (filter && filter.editable && filter.editable === true) {
            graph = graph.filter(function(cls) {
                return cls.editable
            })
        }

        return Promise.resolve(graph);
    },
    getAllOfType: function(typeId, modelId) {
        var keys = Object.keys(classes).filter(function(key) {
            var cls = classes[key];
            return cls.properties.find(function(prp) {
                return prp.typeId === typeId && prp.optional;
            });
        });
        var values = keys.map(function(key) {
            return classes[key];
        })
        return Promise.resolve(values);
    },
    getClassByProperty: function(id, modelId) {
        return Promise.resolve(classes.find(cls => cls.properties.some(prp => prp._id === id)));
    }
};

var profileWriter = {
    putClassUpdateProfile: function(id, modelId, update, projection) {
        return Promise.resolve({
            [id]: update
        });
    }
}

function joinUpdates(updates) {
    const joinedUpdates = updates.reduce(function(joined, upd) {
        return Object.assign(joined, upd);
    }, {});

    console.log(require('util').inspect(joinedUpdates, false, null));
    this.updatedClasses = joinedUpdates;
}



module.exports = {
    clsId: '1',
    superClsId: '3',
    subClsId: '4',
    mandatoryPrpId: '1_1',
    optionalPrpId: '1_2',
    mandatoryPrpIdIndex: 0,
    optionalPrpIdIndex: 1,
    profile: 'A',
    modelReader: modelReader,
    getTypeIdForProperty: getTypeIdForProperty
}

module.exports.joinUpdates = joinUpdates.bind(module.exports)