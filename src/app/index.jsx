import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import { AppContainer } from 'react-hot-loader';
import createHistory from 'history/createBrowserHistory'
import { RouterProvider } from 'redux-little-router';
import createStore from './store/create-store'
import App from './components/container/App'
import { actions } from './reducers/app'


const render = (Component, store, history) => {
    ReactDOM.render(
        <AppContainer>
            <Provider store={ store }>
                <RouterProvider store={ store }>
                    <Component history={ history } />
                </RouterProvider>
            </Provider>
        </AppContainer>,
        document.getElementById('app-wrapper')
    );
};

const history = null //createHistory();
const routes = {
    '/': {
        '/profile': {
            '/:modelId': {
                '/:profileId': {
                    '/': {},
                    '/package': {
                        '/:packageId': {
                            '/': {

                            },
                            '/:tabId(/)': {

                            }
                        }
                    },
                    '/class': {
                        '/:classId': {
                            '/': {

                            },
                            '/:tabId(/)': {

                            }
                        }
                    },
                    '/property': {
                        '/:classId': {
                            '/:propertyId': {
                                '/': {

                                },
                                '/:tabId(/)': {

                                }
                            }
                        }
                    }
                }
            }
        },
        '/login(/)': {}
    }
}

const store = createStore(routes);
//store.dispatch(actions.initApp());

render(App, store, history);

// Hot Module Replacement API
if (module && module.hot) {
    module.hot.accept('./components/container/App', () => {
        render(App, store, history)
    });
/*module.hot.accept('./create-store', () => {
    render(App, createStore())
});*/
}
