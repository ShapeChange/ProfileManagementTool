import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import locales from './locales'

i18n
    .use(LanguageDetector)
    .init({
        resources: locales,
        fallbackLng: 'en',
        ns: ['app'],
        defaultNS: 'app',
        debug: false,
        interpolation: {
            escapeValue: false, // not needed for react!!
            formatSeparator: ',',
            format: function(value, format, lng) {
                if (format === 'uppercase') return value.toUpperCase();
                return value;
            }
        }
    });


export default i18n;