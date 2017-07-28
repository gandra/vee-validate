import Validator from './validator';
import makeMixin from './mixin';
import makeDirective from './directive';
import ErrorBag from './errorBag';
import Rules from './rules';
import { assign, warn } from './utils';
import defaultOptions from './config';
import mapFields from './helpers';

let Vue;

const install = (_Vue, options) => {
  if (Vue) {
    warn('already installed, Vue.use(VeeValidate) should only be called once.');
    return;
  }

  Vue = _Vue;
  const config = assign({}, defaultOptions, options);
  if (config.dictionary) {
    Validator.updateDictionary(config.dictionary);
  }

  Validator.setLocale(config.locale);
  Validator.setStrictMode(config.strict);

  Vue.mixin(makeMixin(Vue, config));
  Vue.directive('validate', makeDirective(config));
};

export default {
  install,
  mapFields,
  Validator,
  ErrorBag,
  Rules,
  version: '__VERSION__'
};
