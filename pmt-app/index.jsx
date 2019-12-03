import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import { AppContainer } from 'react-hot-loader';
import createHistory from 'history/createBrowserHistory'
import { RouterProvider } from 'redux-little-router';
import { I18nextProvider } from 'react-i18next';
import createStore from './store/create-store'
import App from './components/container/App'
import { actions } from './reducers/app'
import i18n from './i18n';


const render = (Component, store, history) => {
    ReactDOM.render(
        <AppContainer>
            <Provider store={store}>
                <I18nextProvider i18n={i18n}>
                    <Component history={history} />
                </I18nextProvider>
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
