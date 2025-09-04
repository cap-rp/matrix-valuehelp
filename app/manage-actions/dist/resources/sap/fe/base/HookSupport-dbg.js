/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/deepClone"], function (deepClone) {
  "use strict";

  var _exports = {};
  /**
   * This type is to be extended with all controller extensions and methods that are hookable.
   */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  // Use two arrays as we cannot index a map through an arbitrary object instance
  const registeredInstances = [];
  const registeredHandlers = [];

  /**
   * Marks a controller extension method to be hookable by generating additional methods that can be used to attach and detach handlers at runtime.
   * @param execution
   * @returns A method decorator
   */
  function hookable(execution) {
    return function (target, propertyKey, descriptor) {
      const indexableTarget = target;
      indexableTarget[`attach${propertyKey.toString()}`] = function (fn) {
        const cExTInstanceHookMap = this;
        if (!cExTInstanceHookMap.hookedHandlers) {
          cExTInstanceHookMap.hookedHandlers = {};
        }
        if (!cExTInstanceHookMap.hookedHandlers[propertyKey.toString()]) {
          cExTInstanceHookMap.hookedHandlers[propertyKey.toString()] = [];
        }
        cExTInstanceHookMap.hookedHandlers[propertyKey.toString()].push(fn);
      };
      indexableTarget[`detach${propertyKey.toString()}`] = function (fn) {
        const cExTInstanceHookMap = this;
        const handlers = cExTInstanceHookMap.hookedHandlers[propertyKey.toString()];
        const index = handlers.indexOf(fn);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      };
      const oldValue = descriptor.value;
      if (execution === "BeforeAsync" || execution === "AfterAsync") {
        descriptor.value = async function () {
          const cExTInstanceHookMap = this;
          const handlers = cExTInstanceHookMap?.hookedHandlers && cExTInstanceHookMap?.hookedHandlers[propertyKey.toString()] || [];
          let returnValue;
          if (execution === "AfterAsync") {
            returnValue = await oldValue.bind(this)(...arguments);
          }
          for (const handler of handlers) {
            await handler.bind(this)(...arguments);
          }
          if (execution === "BeforeAsync") {
            returnValue = await oldValue.bind(this)(...arguments);
          }
          return returnValue;
        };
      } else {
        descriptor.value = function () {
          const cExTInstanceHookMap = this;
          const handlers = cExTInstanceHookMap?.hookedHandlers && cExTInstanceHookMap?.hookedHandlers[propertyKey.toString()] || [];
          let returnValue;
          if (execution === "After") {
            returnValue = oldValue.bind(this)(...arguments);
          }
          for (const handler of handlers) {
            handler.bind(this)(...arguments);
          }
          if (execution === "Before") {
            returnValue = oldValue.bind(this)(...arguments);
          }
          return returnValue;
        };
      }
    };
  }

  /**
   * Checks whether a newRegistration is already included in some existingRegistrations by comparing all relevant attributes.
   * @param existingRegistrations
   * @param newRegistration
   * @returns Result of the check
   */
  _exports.hookable = hookable;
  function isAlreadyRegistered(existingRegistrations, newRegistration) {
    return !!existingRegistrations.find(r => r.name === newRegistration.name && r.method === newRegistration.method && r.targetMethod === newRegistration.targetMethod);
  }
  const hooks = Symbol("hooks");

  /**
   * Registers a method as controller extension hook handler.
   *
   * Currently, only methods of runtime building blocks are supported.
   * @param name Controller extension to hook into
   * @param method Method to hook into
   * @returns A method decorator
   */
  _exports.hooks = hooks;
  function controllerExtensionHandler(name, method) {
    return function (target, propertyKey) {
      const newRegistration = {
        name,
        method: String(method),
        targetMethod: propertyKey
      };
      const index = registeredInstances.indexOf(target.constructor);
      if (!target.constructor[hooks]) {
        Object.defineProperty(target.constructor, hooks, {
          value: []
        });
      }
      target.constructor[hooks]?.push(newRegistration);
      // We need to check if this exact handler is already registered as handlers are registered statically (on the constructor)
      if (index !== -1 && !isAlreadyRegistered(registeredHandlers[index], newRegistration)) {
        registeredHandlers[index].push(newRegistration);
      } else {
        registeredInstances.push(target.constructor);
        registeredHandlers.push([newRegistration]);
      }
    };
  }

  /**
   * Initializes all controller extension handlers registered for a given target.
   * @param target Target class to initialize the handlers for
   * @param target.constructor
   * @param controller PageController instance to get the controller extensions instances from
   */
  _exports.controllerExtensionHandler = controllerExtensionHandler;
  function initControllerExtensionHookHandlers(target, controller) {
    if (target.constructor[hooks]) {
      let registeredHooks = target.constructor[hooks];
      target[hooks] = deepClone(registeredHooks);
      registeredHooks = target[hooks];
      const indexableTarget = target;
      const indexableController = controller;
      for (const registeredHook of registeredHooks) {
        registeredHook.handlerFunction = indexableTarget[registeredHook.targetMethod].bind(target);
        indexableController[registeredHook.name][`attach${String(registeredHook.method)}`](registeredHook.handlerFunction);
        controller.getView()?.attachBeforeExit(() => {
          indexableController[registeredHook.name][`detach${String(registeredHook.method)}`](registeredHook.handlerFunction);
        });
      }
    }
  }
  _exports.initControllerExtensionHookHandlers = initControllerExtensionHookHandlers;
  function removeControllerExtensionHookHandlers(target, controller) {
    if (target[hooks]) {
      const registeredHooks = target[hooks];
      const indexableController = controller;
      for (const registeredHook of registeredHooks) {
        indexableController[registeredHook.name]?.[`detach${String(registeredHook.method)}`]?.(registeredHook.handlerFunction);
      }
    }
  }
  _exports.removeControllerExtensionHookHandlers = removeControllerExtensionHookHandlers;
  function propagateHookFromMixin(target, source) {
    if (source[hooks]) {
      if (target[hooks]) {
        target[hooks].splice(0, 0, ...source[hooks]);
      } else {
        Object.defineProperty(target, hooks, Object.getOwnPropertyDescriptor(source, hooks) || Object.create([]));
      }
    }
  }
  _exports.propagateHookFromMixin = propagateHookFromMixin;
  function xmlViewPreprocessor(source, _caller, _settings) {
    const sourceView = source;
    const controller = sourceView.getController();
    if (controller) {
      const macroAPIChild = sourceView.findAggregatedObjects(true, s => s.isA("sap.fe.macros.MacroAPI"));
      for (const managedObject of macroAPIChild) {
        initControllerExtensionHookHandlers(managedObject, controller);
      }
    }
  }
  _exports.xmlViewPreprocessor = xmlViewPreprocessor;
  return _exports;
}, false);
//# sourceMappingURL=HookSupport-dbg.js.map
