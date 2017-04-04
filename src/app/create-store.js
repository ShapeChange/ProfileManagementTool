import { createStore, applyMiddleware, combineReducers } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';
import * as reducers from './reducers'
import createSocketIoMiddleware from 'redux-socket.io';
import io from 'socket.io-client';

export default function(data) {
    var reducer = combineReducers({
        ...reducers
    })

    var socketIoMiddleware = createSocketIoMiddleware(io(), ['test/']);

    // Be sure to ONLY add this middleware in development!
    const middleware = process.env.NODE_ENV !== 'production' ?
        [require('redux-immutable-state-invariant')(), socketIoMiddleware] :
        [socketIoMiddleware];

    var store = createStore(
        reducer,
        data,
        composeWithDevTools(
            applyMiddleware(...middleware),
        // other store enhancers if any
        )
    );

    if (module && module.hot) {
        // Enable Webpack hot module replacement for reducers
        module.hot.accept('./reducers', () => {
            const nextReducer = require('./reducers');
            store.replaceReducer(combineReducers(nextReducer));
        });
    }

    return store
}
