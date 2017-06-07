var Promise = require("bluebird");
var profileEdit = require('../../src/server/lib/profile-edit');

var classes = {
    1: {
        name: 'CLASS',
        localId: '1',
        editable: true,
        properties: [
            {
                optional: false,
                typeId: '2',
                _id: '1_1'
            },
            {
                optional: true,
                typeId: '5',
                _id: '1_2'
            }
        ]
    },
    2: {
        name: 'TYPE',
        localId: '2',
        editable: true,
        properties: []
    },
    5: {
        name: 'TYPE_OPTIONAL',
        localId: '5',
        editable: true,
        properties: []
    },
    3: {
        name: 'SUPER_CLASS',
        localId: '3',
        editable: true,
        properties: []
    },
    4: {
        name: 'SUB_CLASS',
        localId: '4',
        editable: true,
        properties: []
    }
}

function getTypeIdForProperty(clsId, prpId) {
    var prp = classes[clsId].properties.find(function(prp) {
        return prp._id === prpId
    })

    return prp.typeId;
}

var modelReader = {
    getClass: function(clsId, modelId) {
        return Promise.resolve(classes[clsId]);
    },
    getClassGraph: function(clsId, modelId, subNotSuper) {
        var graph = [classes[clsId]];

        if (clsId === '1') {
            graph.push(subNotSuper ? classes['4'] : classes['3'])
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

var editor = profileEdit(modelReader, profileWriter);


module.exports = {
    clsId: '1',
    superClsId: '3',
    subClsId: '4',
    mandatoryPrpId: '1_1',
    optionalPrpId: '1_2',
    mandatoryPrpIdIndex: 0,
    optionalPrpIdIndex: 1,
    profile: 'A',
    editor: editor,
    getTypeIdForProperty: getTypeIdForProperty
}

module.exports.joinUpdates = joinUpdates.bind(module.exports)