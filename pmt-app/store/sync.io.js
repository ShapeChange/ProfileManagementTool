import createSocketIoMiddleware from './redux-socket.io';
import io from 'socket.io-client';
import ss from 'socket.io-stream';
import escapeStringRegexp from 'escape-string-regexp';
import { LOCATION_CHANGED, push } from 'redux-little-router';
import { actions as appActions, doesChangeState, getFilter, getPendingFilter, isFlattenInheritance, isFlattenOninas } from '../reducers/app'
import { actions, getModels, getPendingModel, getPendingPackage, getPendingClass, getSelectedModel, getSelectedPackage, getSelectedClass } from '../reducers/model'
import { actions as authActions, getToken, getUser } from '../reducers/auth'

export default function createSyncIoMiddleware() {
    const socket = io({
        path: '/pmt/socket.io'
    });

    return createSocketIoMiddleware(socket, [
        LOCATION_CHANGED,
        appActions.startFileImport.toString(),
        appActions.startFileExport.toString(),
        appActions.setFilter.toString(),
        appActions.toggleFlattenInheritance.toString(),
        appActions.toggleFlattenOninas.toString(),
        appActions.confirmDelete.toString(),
        appActions.confirmProfileEdit.toString(),
        actions.updateProfile.toString(),
        actions.updateEditable.toString(),
        authActions.createUser.toString(),
        authActions.loginUser.toString(),
        authActions.onUserLogin.toString()
    ], {
        execute: conditionalExecute
    });
}

var timer;

// where to put/get fetch metadata? what was fetched last?
function conditionalExecute(action, emitOrig, next, store, socket) {
    /*if (doesChangeState(store.getState(), action)) {
        emit('action', action);
    }*/

    var emit = emitOrig;
    var token;

    if (action.type !== authActions.loginUser.toString() && action.type !== authActions.createUser.toString() && action.type !== authActions.onUserLogin.toString() && !(action.type === LOCATION_CHANGED && action.payload.pathname.indexOf('/login') === 0)) {
        token = getToken(store.getState());

        if (!token) {
            return next(push('/login'))
        }

        emit = function(channel, action) {
            action.payload.token = token;

            emitOrig(channel, action);
        }
    }

    if (action.type === authActions.onUserLogin.toString()) {
        next(action);

        return store.dispatch(push('/'))
    }

    if (action.type === actions.updateProfile.toString() || action.type === actions.updateEditable.toString()
            || action.type === appActions.confirmDelete.toString() || action.type === appActions.confirmProfileEdit.toString()
            || action.type === authActions.createUser.toString() || action.type === authActions.loginUser.toString()) {

        next(action);

        emit('action', action);


    } else if (action.type === appActions.startFileImport.toString()) {

        next(action);

        const stream = ss.createStream();
        // upload a file to the server. 
        ss(socket).emit('import', stream, {
            metadata: action.payload.metadata,
            token: token
        });
        const blobStream = ss.createBlobReadStream(action.payload.file);

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

        ss(socket).emit('export', stream, {
            metadata: action.payload,
            token: token
        });

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

    } else if (action.type === appActions.toggleFlattenInheritance.toString()) {

        const previousIsFlattenInheritance = isFlattenInheritance(store.getState());

        next(action);

        const currentIsFlattenInheritance = isFlattenInheritance(store.getState())

        if (currentIsFlattenInheritance !== previousIsFlattenInheritance) {
            const selectedClass = getSelectedClass(store.getState())

            if (selectedClass) {
                emit('action', actions.fetchClass({
                    id: selectedClass,
                    modelId: getSelectedModel(store.getState()),
                    filter: getFilter(store.getState()),
                    flattenInheritance: currentIsFlattenInheritance,
                    flattenOninas: isFlattenOninas(store.getState())
                }));
            }
        }

    } else if (action.type === appActions.toggleFlattenOninas.toString()) {

        const previousIsFlattenOninas = isFlattenOninas(store.getState());

        next(action);

        const currentIsFlattenOninas = isFlattenOninas(store.getState())

        if (currentIsFlattenOninas !== previousIsFlattenOninas) {
            const selectedClass = getSelectedClass(store.getState())

            if (selectedClass) {
                emit('action', actions.fetchClass({
                    id: selectedClass,
                    modelId: getSelectedModel(store.getState()),
                    filter: getFilter(store.getState()),
                    flattenInheritance: isFlattenInheritance(store.getState()),
                    flattenOninas: currentIsFlattenOninas
                }));
            }
        }

    } else {

        const user = getUser(store.getState());

        if (!user)
            return next(action);
        ;

        const models = getModels(store.getState());

        if (!models || models.length === 0) {
            emit('action', actions.fetchModels({
                owner: user._id
            }));
        }

        const previousPendingModel = getPendingModel(store.getState())
        const previousPendingPackage = getPendingPackage(store.getState())
        const previousPendingClass = getPendingClass(store.getState())

        next(action);

        const flattenInheritance = isFlattenInheritance(store.getState())
        const flattenOninas = isFlattenOninas(store.getState())
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
                modelId: getSelectedModel(store.getState()),
                filter: filter
            }));
        if (pendingClass && pendingClass !== previousPendingClass)
            emit('action', actions.fetchClass({
                id: pendingClass,
                modelId: getSelectedModel(store.getState()),
                filter: filter,
                flattenInheritance: flattenInheritance,
                flattenOninas: flattenOninas
            }));
    }
}

function updateFilter(store, emit, pendingFilter) {
    const flattenInheritance = isFlattenInheritance(store.getState())
    const flattenOninas = isFlattenOninas(store.getState())
    const filter = escapeStringRegexp(pendingFilter.toLowerCase())
    const selectedModel = getSelectedModel(store.getState())
    const selectedPackage = getSelectedPackage(store.getState())
    const selectedClass = getSelectedClass(store.getState())

    if (selectedModel) {
        const fetchAction = actions.fetchModel({
            id: selectedModel,
            filter: filter
        })

        store.dispatch(fetchAction)
        emit('action', fetchAction);
    }
    if (selectedPackage) {
        const fetchAction = actions.fetchPackage({
            id: selectedPackage,
            filter: filter
        })

        store.dispatch(fetchAction)
        emit('action', fetchAction);
    }
    if (selectedClass) {
        const fetchAction = actions.fetchClass({
            id: selectedClass,
            modelId: selectedModel,
            filter: filter,
            flattenInheritance: flattenInheritance,
            flattenOninas: flattenOninas
        })

        store.dispatch(fetchAction)
        emit('action', fetchAction);
    }
}