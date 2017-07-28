import { getScope, getDataAttribute, isObject, toArray, find, getRules, getPath, hasPath } from './utils';

/**
 * Generates the options required to construct a field.
 */
export default class Generator {
  static generate (el, binding, vnode, options = {}) {
    const model = Generator.resolveModel(binding, vnode);

    return {
      name: Generator.resolveName(el, vnode),
      el: el,
      listen: !binding.modifiers.disable,
      scope: Generator.resolveScope(el, binding),
      vm: vnode.context,
      expression: binding.value,
      component: vnode.child,
      classes: options.classes,
      classNames: options.classNames,
      getter: Generator.resolveGetter(el, vnode, model),
      events: Generator.resolveEvents(el, vnode) || options.events,
      model,
      delay: Generator.resolveDelay(el, vnode, options),
      rules: getRules(binding, el),
      initial: !!binding.modifiers.initial,
      invalidateFalse: !!(el && el.type === 'checkbox'),
      alias: Generator.resolveAlias(el, vnode),
    };
  }

  /**
   * Resolves the delay value.
   * @param {*} el
   * @param {*} vnode
   * @param {Object} options
   */
  static resolveDelay (el, vnode, options = {}) {
    return getDataAttribute(el, 'delay') || (vnode.child && vnode.child.$attrs && vnode.child.$attrs['data-vv-delay']) || options.delay;
  }

  /**
   * Resolves the alias for the field.
   * @param {*} el 
   * @param {*} vnode 
   */
  static resolveAlias (el, vnode) {
    return getDataAttribute(el, 'as') || (vnode.child && vnode.child.$attrs && vnode.child.$attrs['data-vv-as']) || el.title || null;
  }

  /**
   * Resolves the events to validate in response to.
   * @param {*} el
   * @param {*} vnode
   */
  static resolveEvents (el, vnode) {
    if (vnode.child) {
      return getDataAttribute(el, 'validate-on') || (vnode.child.$attrs && vnode.child.$attrs['data-vv-validate-on']);
    }

    return getDataAttribute(el, 'validate-on');
  }

  /**
   * Resolves the scope for the field.
   * @param {*} el
   * @param {*} binding
   */
  static resolveScope (el, binding) {
    return (isObject(binding.value) ? binding.value.scope : getScope(el));
  }

  /**
   * Checks if the node directives contains a v-model or a specified arg.
   * Args take priority over models.
   *
   * @return {Object}
   */
  static resolveModel (binding, vnode) {
    if (binding.arg) {
      return binding.arg;
    }

    if (isObject(binding.value) && binding.value.arg) {
      return binding.value.arg;
    }

    const model = vnode.data.model || find(vnode.data.directives, d => d.name === 'model');
    if (!model) {
      return null;
    }

    const watchable = /^[a-z_]+[0-9]*(\w*\.[a-z_]\w*)*$/i.test(model.expression) && hasPath(model.expression, vnode.context);

    if (!watchable) {
      return null;
    }

    return model.expression;
  }

  /**
     * Resolves the field name to trigger validations.
     * @return {String} The field name.
     */
  static resolveName (el, vnode) {
    if (vnode.child) {
      return getDataAttribute(el, 'name') || (vnode.child.$attrs && vnode.child.$attrs['data-vv-name']) || vnode.child.name;
    }

    return getDataAttribute(el, 'name') || el.name;
  }

  /**
   * Returns a value getter input type.
   */
  static resolveGetter (el, vnode, model) {
    if (model) {
      return () => {
        return getPath(model, vnode.context);
      };
    }

    if (vnode.child) {
      return () => {
        const path = getDataAttribute(el, 'value-path') || (vnode.child.$attrs && vnode.child.$attrs['data-vv-value-path']);
        if (path) {
          return getPath(path, vnode.child);
        }
        return vnode.child.value;
      };
    }

    switch (el.type) {
    case 'checkbox': return () => {
      let els = document.querySelectorAll(`input[name="${el.name}"]`);

      els = toArray(els).filter(el => el.checked);
      if (!els.length) return undefined;

      return els.map(checkbox => checkbox.value);
    };
    case 'radio': return () => {
      const els = document.querySelectorAll(`input[name="${el.name}"]`);
      const elm = find(els, el => el.checked);

      return elm && elm.value;
    };
    case 'file': return (context) => {
      return toArray(el.files);
    };
    case 'select-multiple': return () => {
      return toArray(el.options).filter(opt => opt.selected).map(opt => opt.value);
    };
    default: return () => {
      return el && el.value;
    };
    }
  }
}
