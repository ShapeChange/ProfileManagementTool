import createSocketIoMiddleware from './redux-socket.io';
import io from 'socket.io-client';
import ss from 'socket.io-stream';
import { LOCATION_CHANGED } from 'redux-little-router';
import { actions as appActions, doesChangeState, getFilter, getPendingFilter } from '../reducers/app'
import { actions, getModels, getPendingModel, getPendingPackage, getPendingClass, getSelectedModel, getSelectedPackage, getSelectedClass } from '../reducers/model'

export default function createSyncIoMiddleware() {
    const socket = io({
        path: '/pmt/socket.io'
    });

    return createSocketIoMiddleware(socket, [
        LOCATION_CHANGED,
        appActions.startFileImport.toString(),
        appActions.startFileExport.toString(),
        appActions.setFilter.toString(),
        actions.updateProfile.toString(),
        actions.updateEditable.toString()
    ], {
        execute: conditionalExecute
    });
}

var timer;

// where to put/get fetch metadata? what was fetched last?
function conditionalExecute(action, emit, next, store, socket) {
    /*if (doesChangeState(store.getState(), action)) {
        emit('action', action);
    }*/

    if (action.type === actions.updateProfile.toString() || action.type === actions.updateEditable.toString()) {

        next(action);

        emit('action', action);


    } else if (action.type === appActions.startFileImport.toString()) {

        next(action);

        const stream = ss.createStream();
        // upload a file to the server. 
        ss(socket).emit('import', stream, action.payload.metadata);
        const blobStream = ss.createBlobReadStream(action.payload.file);

        var written = 0;
        blobStream.on('data', function(chunk) {
            written += chunk.length;
            store.dispatch(appActions.progressFileImport({
                written: written
            }))
        });

        blobStream.pipe(stream);


    } else if (action.type === appActions.startFileExport.toString()) {

        next(action);

        const stream = ss.createStream();
        let fileBuffer = [];
        //let fileLength = 0;

        stream.on('data', function(chunk) {
            //fileLength += chunk.length;
            //console.log(fileLength)
            fileBuffer.push(chunk);
        });

        stream.on('end', function() {

            store.dispatch(appActions.endFileExport(fileBuffer))
        });

        ss(socket).emit('export', stream, action.payload);

    } else if (action.type === appActions.setFilter.toString()) {

        clearTimeout(timer);

        const previousFilter = getPendingFilter(store.getState()).filter;

        next(action);

        const pendingFilter = getPendingFilter(store.getState()).filter

        if (pendingFilter !== previousFilter) {
            if (pendingFilter.length >= 3) {
                timer = setTimeout(() => {
                    updateFilter(store, emit, pendingFilter)
                }, 500);
            } else if (pendingFilter.length === 0) {
                updateFilter(store, emit, pendingFilter)
            }
        }

    } else {

        // TODO: get owner from auth
        const models = getModels(store.getState());
        if (!models || models.length === 0) {
            emit('action', actions.fetchModels('unknown'));
        }

        const previousPendingModel = getPendingModel(store.getState())
        const previousPendingPackage = getPendingPackage(store.getState())
        const previousPendingClass = getPendingClass(store.getState())

        next(action);

        const filter = getFilter(store.getState())
        const pendingModel = getPendingModel(store.getState())
        const pendingPackage = getPendingPackage(store.getState())
        const pendingClass = getPendingClass(store.getState())

        if (pendingModel && pendingModel !== previousPendingModel)
            emit('action', actions.fetchModel({
                id: pendingModel,
                filter: filter
            }));
        if (pendingPackage && pendingPackage !== previousPendingPackage)
            emit('action', actions.fetchPackage({
                id: pendingPackage,
                modelId: pendingModel,
                filter: filter
            }));
        if (pendingClass && pendingClass !== previousPendingClass)
            emit('action', actions.fetchClass({
                id: pendingClass,
                modelId: pendingModel,
                filter: filter
            }));
    }
}

function updateFilter(store, emit, pendingFilter) {
    const selectedModel = getSelectedModel(store.getState())
    const selectedPackage = getSelectedPackage(store.getState())
    const selectedClass = getSelectedClass(store.getState())

    if (selectedModel) {
        const fetchAction = actions.fetchModel({
            id: selectedModel,
            filter: pendingFilter
        })

        store.dispatch(fetchAction)
        emit('action', fetchAction);
    }
    if (selectedPackage) {
        const fetchAction = actions.fetchPackage({
            id: selectedPackage,
            filter: pendingFilter
        })

        store.dispatch(fetchAction)
        emit('action', fetchAction);
    }
    if (selectedClass) {
        const fetchAction = actions.fetchClass({
            id: selectedClass,
            filter: pendingFilter
        })

        store.dispatch(fetchAction)
        emit('action', fetchAction);
    }
}