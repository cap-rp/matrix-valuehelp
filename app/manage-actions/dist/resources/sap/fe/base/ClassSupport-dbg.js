/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/ObjectPath", "sap/base/util/deepClone", "sap/base/util/merge", "sap/base/util/uid", "sap/fe/base/HookSupport", "sap/ui/base/Metadata", "sap/ui/base/Object", "sap/ui/core/mvc/ControllerMetadata", "sap/ui/model/json/JSONModel"], function (ObjectPath, deepClone, merge, uid, HookSupport, Metadata, BaseObject, ControllerMetadata, JSONModel) {
  "use strict";

  var _exports = {};
  var propagateHookFromMixin = HookSupport.propagateHookFromMixin;
  var hookable = HookSupport.hookable;
  const ensureMetadata = function (target) {
    target.metadata = merge({
      controllerExtensions: {},
      properties: {},
      aggregations: {},
      references: {},
      associations: {},
      methods: {},
      events: {},
      interfaces: []
    }, target.metadata ?? {});
    return target.metadata;
  };

  /**
   * Method that will find the correct API object based on the current control hierarchy.
   * @param target
   * @returns The proper getAPI function for this constructor
   */
  function prepareGetAPIFunction(target) {
    return function (oEvent) {
      let apiFQN = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : target.getMetadata().getName();
      let oSource = oEvent.getSource();
      if (target._getAPIExtension) {
        oSource = target._getAPIExtension(oSource) ?? oSource;
      }
      while (oSource && !oSource.isA(apiFQN) && oSource.getParent) {
        if (this.isDependentBound) {
          const oDependents = oSource.getDependents();
          const hasCorrectDependent = oDependents.find(oDependent => oDependent.isA(apiFQN));
          if (hasCorrectDependent) {
            oSource = hasCorrectDependent;
          } else {
            oSource = oSource.getParent();
          }
        } else {
          oSource = oSource.getParent();
        }
      }
      if (!oSource || !oSource.isA(apiFQN)) {
        const oSourceMap = this.instanceMap.get(this);
        oSource = oSourceMap?.[oSourceMap.length - 1];
      }
      let targetControl;
      if (oSource && oSource.isA(apiFQN)) {
        targetControl = oSource;
      }
      return targetControl;
    };
  }

  /**
   * Ensures that when an xmlEventHandler is defined, the `getAPI` function is properly assigned.
   * @param target The class constructor that should hold the static functions
   */
  const ensureGetAPI = function (target) {
    if (!target.__apiRegistered) {
      target.__apiRegistered = true;
      target.instanceMap = new WeakMap();
      target.registerInstance = function (_instance) {
        if (!this.instanceMap.get(_instance.constructor)) {
          this.instanceMap.set(_instance.constructor, []);
        }
        this.instanceMap.get(_instance.constructor).push(_instance);
      };
      target.getAPI = prepareGetAPIFunction(target);
    }
  };
  /**
   * Allows to define a property that will hold the control state.
   *
   * Properties defined with this decorator will be automatically bound to the control state when used in JSX.
   * Arrays need to be bound using the `bindState` function.
   * @experimental
   * @returns A property decorator
   */
  function defineState() {
    return function (target, propertyKey, propertyDescriptor) {
      const metadata = ensureMetadata(target);
      if (metadata.stateProperty !== undefined) {
        throw new Error("Only one state property per control is allowed");
      }
      metadata.stateProperty = propertyKey;
      delete propertyDescriptor.writable;
      metadata.statePropertyDefaultValue ??= propertyDescriptor.initializer?.();
      delete propertyDescriptor.initializer;
      return propertyDescriptor;
    }; // This is technically an accessor decorator, but somehow the compiler doesn't like it if i declare it as such.;
  }

  /* #region CONTROLLER EXTENSIONS */

  /**
   * Defines that the following method is an override for the method name with the same name in the specific controller extension or base implementation.
   * @param extensionName The name of the extension that will be overridden
   * @returns The decorated method
   */
  _exports.defineState = defineState;
  function methodOverride(extensionName) {
    return function (target, propertyKey) {
      if (!target.override) {
        target.override = {};
      }
      if (!target.overrides) {
        target.overrides = {};
      }
      let currentTarget = target.overrides;
      if (extensionName) {
        if (!currentTarget.extension) {
          currentTarget.extension = {};
        }
        if (!currentTarget.extension[extensionName]) {
          currentTarget.extension[extensionName] = {};
        }
        currentTarget = currentTarget.extension[extensionName];
      }
      currentTarget[propertyKey.toString()] = target[propertyKey.toString()];
    };
  }

  /**
   * Defines that the method can be extended by other controller extension based on the defined overrideExecutionType.
   * @param overrideExecution The OverrideExecution defining when the override should run (Before / After / Instead)
   * @returns The decorated method
   */
  _exports.methodOverride = methodOverride;
  function extensible(overrideExecution) {
    return function (target, propertyKey, descriptor) {
      const metadata = ensureMetadata(target);
      if (!metadata.methods[propertyKey.toString()]) {
        metadata.methods[propertyKey.toString()] = {};
      }
      metadata.methods[propertyKey.toString()].overrideExecution = overrideExecution;

      // by default, every extensible method is also hookable (except those defined as Instead)
      if (overrideExecution !== "Instead") {
        hookable(overrideExecution)(target, propertyKey, descriptor);
      }
    };
  }

  /**
   * Defines that the method will be publicly available for controller extension usage.
   * @returns The decorated method
   */
  _exports.extensible = extensible;
  function publicExtension() {
    return function (target, propertyKey, descriptor) {
      const metadata = ensureMetadata(target);
      descriptor.enumerable = true;
      if (!metadata.methods[propertyKey.toString()]) {
        metadata.methods[propertyKey.toString()] = {};
      }
      metadata.methods[propertyKey.toString()].public = true;
    };
  }
  /**
   * Defines that the method will be only available for internal usage of the controller extension.
   * @returns The decorated method
   */
  _exports.publicExtension = publicExtension;
  function privateExtension() {
    return function (target, propertyKey, descriptor) {
      const metadata = ensureMetadata(target);
      descriptor.enumerable = true;
      if (!metadata.methods[propertyKey.toString()]) {
        metadata.methods[propertyKey.toString()] = {};
      }
      metadata.methods[propertyKey.toString()].public = false;
    };
  }
  /**
   * Defines that the method cannot be further extended by other controller extension.
   * @returns The decorated method
   */
  _exports.privateExtension = privateExtension;
  function finalExtension() {
    return function (target, propertyKey, descriptor) {
      const metadata = ensureMetadata(target);
      descriptor.enumerable = true;
      if (!metadata.methods[propertyKey.toString()]) {
        metadata.methods[propertyKey.toString()] = {};
      }
      metadata.methods[propertyKey.toString()].final = true;
    };
  }

  /**
   * Defines that we are going to use instantiate a controller extension under the following variable name.
   * @param extensionClass The controller extension that will be instantiated
   * @returns The decorated property
   */
  _exports.finalExtension = finalExtension;
  function usingExtension(extensionClass) {
    return function (target, propertyKey, propertyDescriptor) {
      const metadata = ensureMetadata(target);
      delete propertyDescriptor.initializer;
      metadata.controllerExtensions[propertyKey.toString()] = extensionClass;
      return propertyDescriptor;
    }; // This is technically an accessor decorator, but somehow the compiler doesn't like it if I declare it as such.
  }

  /* #endregion */

  /* #region CONTROL */
  /**
   * Indicates that the property shall be declared as an event on the control metadata.
   * @returns The decorated property
   */
  _exports.usingExtension = usingExtension;
  function event() {
    return function (target, eventKey) {
      const metadata = ensureMetadata(target);
      if (!metadata.events[eventKey.toString()]) {
        metadata.events[eventKey.toString()] = {};
      }
    };
  }

  /**
   * Defines the following property in the control metadata.
   * @param attributeDefinition The property definition
   * @returns The decorated property.
   */
  _exports.event = event;
  function property(attributeDefinition) {
    return function (target, propertyKey, propertyDescriptor) {
      const metadata = ensureMetadata(target);
      if (attributeDefinition.bindable === undefined) {
        attributeDefinition.bindable = true;
      }
      if (attributeDefinition.isBindingInfo === true) {
        attributeDefinition.bindable = false;
        attributeDefinition.group = "Data";
      }
      if (!metadata.properties[propertyKey]) {
        metadata.properties[propertyKey] = attributeDefinition;
      }
      delete propertyDescriptor.writable;
      attributeDefinition.defaultValue ??= propertyDescriptor.initializer?.();
      delete propertyDescriptor.initializer;
      return propertyDescriptor;
    }; // This is technically an accessor decorator, but somehow the compiler doesn't like it if i declare it as such.
  }

  /**
   * Defines and configures the following aggregation in the control metadata.
   * @param aggregationDefinition The aggregation definition
   * @returns The decorated property.
   */
  _exports.property = property;
  function aggregation(aggregationDefinition) {
    return function (target, propertyKey, propertyDescriptor) {
      const metadata = ensureMetadata(target);
      if (aggregationDefinition.multiple === undefined) {
        // UI5 defaults this to true but this is just weird...
        aggregationDefinition.multiple = false;
      }
      if (!metadata.aggregations[propertyKey]) {
        metadata.aggregations[propertyKey] = aggregationDefinition;
      }
      if (aggregationDefinition.isDefault) {
        metadata.defaultAggregation = propertyKey;
      }
      delete propertyDescriptor.writable;
      aggregationDefinition.defaultValue ??= propertyDescriptor.initializer?.();
      delete propertyDescriptor.initializer;
      return propertyDescriptor;
    }; // This is technically an accessor decorator, but somehow the compiler doesn't like it if I declare it as such.
  }

  /**
   * Defines and configures the following association in the control metadata.
   * @param ui5AssociationMetadata The definition of the association.
   * @returns The decorated property
   */
  _exports.aggregation = aggregation;
  function association(ui5AssociationMetadata) {
    return function (target, propertyKey, propertyDescriptor) {
      const metadata = ensureMetadata(target);
      if (!metadata.associations[propertyKey]) {
        metadata.associations[propertyKey] = ui5AssociationMetadata;
      }
      delete propertyDescriptor.writable;
      delete propertyDescriptor.initializer;
      return propertyDescriptor;
    }; // This is technically an accessor decorator, but somehow the compiler doesn't like it if i declare it as such.
  }

  /**
   * Defines in the metadata that this control implements a specific interface.
   * @param interfaceName The name of the implemented interface
   * @returns The decorated method
   */
  _exports.association = association;
  function implementInterface(interfaceName) {
    return function (target) {
      const metadata = ensureMetadata(target);
      metadata.interfaces.push(interfaceName);
    };
  }

  /**
   * Indicates that the following method should also be exposed statically so we can call it from XML.
   * @returns The decorated method
   */
  _exports.implementInterface = implementInterface;
  function xmlEventHandler() {
    return function (target, propertykey) {
      const currentConstructor = target.constructor;
      ensureGetAPI(currentConstructor);
      currentConstructor[propertykey.toString()] = function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        if (args?.length) {
          const currentTarget = currentConstructor.getAPI(args[0]);
          currentTarget?.[propertykey.toString()](...args);
        }
      };
    };
  }
  _exports.xmlEventHandler = xmlEventHandler;
  /**
   * Indicates that the following class should define a UI5 control of the specified name.
   * @param sTarget The fully qualified name of the UI5 class
   * @param metadataDefinition Inline metadata definition
   * @returns A class decorator that will create a ui5 class
   */
  function defineUI5Class(sTarget, metadataDefinition) {
    return function (constructor) {
      if (!constructor.prototype.metadata) {
        constructor.prototype.metadata = {};
      }
      if (metadataDefinition) {
        for (const key in metadataDefinition) {
          if (constructor.prototype.metadata[key]) {
            if (Array.isArray(constructor.prototype.metadata[key])) {
              constructor.prototype.metadata[key] = constructor.prototype.metadata[key].concat(metadataDefinition[key]);
            } else {
              constructor.prototype.metadata[key] = {
                ...constructor.prototype.metadata[key],
                ...metadataDefinition[key]
              };
            }
          } else {
            constructor.prototype.metadata[key] = metadataDefinition[key];
          }
        }
      }
      return registerUI5Metadata(constructor, sTarget, constructor.prototype);
    };
  }
  _exports.defineUI5Class = defineUI5Class;
  /**
   * Mixin a specific interface including all its methods and properties into the control.
   * @param interfaceClass Implementation class of the control
   * @returns The decorated class
   */
  function mixin(interfaceClass) {
    return function (baseCtor) {
      if (baseCtor.prototype.extend) {
        throw new Error("The mixinInterface decorator must be placed after `defineUi5Class`");
      }
      const metadata = ensureMetadata(baseCtor.prototype);
      let interfaceProtoTypeToMix = interfaceClass.prototype;
      while (interfaceProtoTypeToMix) {
        baseCtor = _addInterfaceProtoTypesToBaseClass(baseCtor, metadata, interfaceProtoTypeToMix);
        interfaceProtoTypeToMix = Object.getPrototypeOf(interfaceProtoTypeToMix);
      }
      propagateHookFromMixin(baseCtor, interfaceClass);

      // Hook to add potentially more logic to the mixin
      interfaceClass.prototype.setupMixin?.(baseCtor);
      return baseCtor;
    };
  }
  _exports.mixin = mixin;
  function createReference() {
    return {
      current: undefined,
      setCurrent: function (oControlInstance) {
        this.current = oControlInstance;
      }
    };
  }
  /**
   * Defines that the following object will hold a reference to a control through jsx templating.
   * @returns The decorated property.
   */
  _exports.createReference = createReference;
  function defineReference() {
    return function (target, propertyKey, propertyDescriptor) {
      const metadata = ensureMetadata(target);
      delete propertyDescriptor.writable;
      delete propertyDescriptor.initializer;
      if (BaseObject.isObjectA(target, "sap.ui.core.Control")) {
        if (!metadata.references[propertyKey]) {
          metadata.references[propertyKey] = true;
        }
      } else {
        propertyDescriptor.initializer = createReference;
      }
      return propertyDescriptor;
    }; // This is technically an accessor decorator, but somehow the compiler doesn't like it if i declare it as such.;
  }
  _exports.defineReference = defineReference;
  function _addInterfaceProtoTypesToBaseClass(baseCtor, baseClassMetadata, interfaceClassPrototype) {
    const interfaceName = interfaceClassPrototype?.getInterfaceName?.();
    if (interfaceName) {
      baseClassMetadata.interfaces.push(interfaceName);
    }
    Object.getOwnPropertyNames(interfaceClassPrototype).forEach(name => {
      if (name !== "constructor" && name !== "setupMixin" && name !== "metadata") {
        if (!baseCtor.prototype[name]) {
          // The base class "wins" over the mixin
          Object.defineProperty(baseCtor.prototype, name, Object.getOwnPropertyDescriptor(interfaceClassPrototype, name) || Object.create(null));
        }
      }
      if (name === "metadata") {
        baseCtor.prototype.metadata = merge(baseCtor.prototype.metadata, interfaceClassPrototype.metadata);
      }
    });
    return baseCtor;
  }
  function _getHandlerForStateProperty(jsonModel, prop) {
    const pathInModel = `/${prop.toString()}`;
    const oObj = deepClone(jsonModel.getObject(pathInModel));
    let oTarget;
    if (prop === "__bindingInfo") {
      return {
        model: "$componentState"
      };
    }
    if (typeof oObj === "string") {
      oTarget = oObj;
    } else if (typeof oObj === "number") {
      oTarget = oObj;
    } else if (typeof oObj === "boolean") {
      oTarget = oObj;
    } else if (Array.isArray(oObj)) {
      oTarget = new Proxy(oObj, {
        get(target, p, receiver) {
          const ref = Reflect.get(target, p, receiver);
          if (typeof ref === "function") {
            return ref.bind(target);
          } else if (ref === undefined && isNaN(Number(p.toString()))) {
            return {
              __bindingInfo: {
                model: "$componentState",
                path: p
              }
            };
          }
          return ref;
        }
      });
    } else {
      oTarget = {
        ...oObj
      };
    }
    if (typeof oTarget === "object") {
      oTarget.__bindingInfo = {
        model: "$componentState",
        path: pathInModel
      };
    }
    return oTarget;
  }
  const boundProperties = Symbol("boundProperties");
  function createStateProxy(targetControl, statePropertyName, boundToStateProps, initialData) {
    // Lazy initialization of the state property
    targetControl.setModel(new JSONModel(initialData), "$componentState");
    const stateModel = targetControl.getModel("$componentState");
    stateModel.attachPropertyChange(evt => {
      const path = evt.getParameter("path")?.substring(1); // to remove the first /
      if (path && boundToStateProps.includes(path)) {
        targetControl.setProperty(path, evt.getParameter("value"));
      }
    });
    targetControl.__stateCreated = true;
    const proxy = new Proxy(stateModel, {
      get: (target, prop) => {
        return _getHandlerForStateProperty(target, prop);
      },
      set: (setStateModel, prop, value) => {
        // we need to check whether the property is a known bound property in any of the related classes
        const knownBoundProperties = targetControl[boundProperties];
        if (knownBoundProperties.includes(prop.toString())) {
          targetControl._ignoreStatePropertyUpdate = true;
          targetControl.setProperty(prop.toString(), value);
          targetControl._ignoreStatePropertyUpdate = false;
        }
        const setResult = setStateModel.setProperty(`/${prop.toString()}`, value);
        targetControl._updateStateDebounced(prop.toString());
        return setResult;
      }
    });
    Object.defineProperty(targetControl, statePropertyName, {
      configurable: true,
      get: () => {
        return proxy;
      },
      set(value) {
        // Replacing the complete state
        stateModel.setProperty(`/`, value);
      }
    });
    return proxy;
  }
  function _createStateProperty(obj, targetControl) {
    if (obj.metadata?.stateProperty || targetControl[boundProperties]) {
      let updatingState = false;
      const boundToStateProps = [];
      for (const propertyName in obj.metadata?.properties) {
        const propertyDef = obj.metadata.properties[propertyName];
        if (propertyDef.bindToState) {
          boundToStateProps.push(propertyName);
        }
      }
      // as we may have bound properties in parent classes and subclasses, we keep track of those in the model itself
      targetControl[boundProperties] ??= [];
      targetControl[boundProperties] = [...targetControl[boundProperties], ...boundToStateProps];
      if (obj.metadata?.stateProperty) {
        // This method can be used to force the state to be applied and wait for it to be applied in tests
        targetControl._updateState = async function () {
          delete this._updateStateTimer;
          if (!updatingState) {
            updatingState = true;
            await this.onStateChange?.(this._changedProps);
            this._changedProps = [];
            updatingState = false;
          }
        };
        targetControl._updateStateDebounced = function (changedProp) {
          this._changedProps ??= [];
          if (!this._changedProps.includes(changedProp)) {
            this._changedProps.push(changedProp);
          }
          if (!this._updateStateTimer && !updatingState) {
            this._updateStateTimer = setTimeout(() => {
              this._updateState();
            }, 200);
          }
        };
        const statePropertyName = obj.metadata.stateProperty;
        targetControl.__stateCreated = false;
        targetControl.__stateName = statePropertyName;
        Object.defineProperty(targetControl, statePropertyName, {
          configurable: true,
          get: () => {
            return createStateProxy(targetControl, statePropertyName, targetControl[boundProperties]);
          },
          set: value => {
            createStateProxy(targetControl, statePropertyName, targetControl[boundProperties], value);
          }
        });
        if (obj.metadata.statePropertyDefaultValue) {
          targetControl[obj.metadata.stateProperty] = {
            ...obj.metadata.statePropertyDefaultValue
          };
        }
        const fnApplySettings = targetControl.applySettings;
        targetControl.applySettings = function (mSettings) {
          delete mSettings?.models?.$componentState;
          return fnApplySettings.call(this, mSettings);
        };
      }
      const fnSetProperty = targetControl.setProperty;
      if (targetControl[boundProperties].length > 0) {
        targetControl.setProperty = function (sPropertyName, oValue, bSuppressInvalidate) {
          if (targetControl[boundProperties].includes(sPropertyName) && !this._ignoreStatePropertyUpdate) {
            if (!this.__stateCreated) {
              createStateProxy(targetControl, targetControl.__stateName, targetControl[boundProperties]);
            }
            this.getModel("$componentState").setProperty(`/${sPropertyName}`, oValue);
            targetControl._updateStateDebounced(sPropertyName);
          }
          return fnSetProperty.call(this, sPropertyName, oValue, bSuppressInvalidate);
        };
      }
    }
  }

  /**
   * Internal heavy lifting that will take care of creating the class property for ui5 to use.
   * @param clazz The class prototype
   * @param name The name of the class to create
   * @param inObj The metadata object
   * @returns The metadata class
   */
  function registerUI5Metadata(clazz, name, inObj) {
    if (clazz.getMetadata?.().isA("sap.ui.core.mvc.ControllerExtension")) {
      Object.getOwnPropertyNames(inObj).forEach(objName => {
        const descriptor = Object.getOwnPropertyDescriptor(inObj, objName);
        if (descriptor && !descriptor.enumerable) {
          descriptor.enumerable = true;
        }
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = {};
    obj.metadata = inObj.metadata || {};
    obj.override = inObj.override;
    obj.constructor = clazz;
    obj.metadata.baseType = Object.getPrototypeOf(clazz.prototype).getMetadata().getName();
    if (clazz?.getMetadata()?.getStereotype() === "control") {
      const rendererDefinition = inObj.renderer || clazz.renderer || clazz.render;
      obj.renderer = {
        apiVersion: 2
      };
      if (typeof rendererDefinition === "function") {
        obj.renderer.render = rendererDefinition;
      } else if (rendererDefinition != undefined) {
        obj.renderer = rendererDefinition;
      }
    }
    obj.metadata.interfaces = inObj.metadata?.interfaces || clazz.metadata?.interfaces;
    Object.keys(clazz.prototype).forEach(key => {
      if (key !== "metadata") {
        try {
          obj[key] = clazz.prototype[key];
        } catch (e) {
          // Do nothing
        }
      }
    });
    if (obj.metadata?.controllerExtensions && Object.keys(obj.metadata.controllerExtensions).length > 0) {
      for (const cExtName in obj.metadata.controllerExtensions) {
        obj[cExtName] = obj.metadata.controllerExtensions[cExtName];
      }
    }
    const output = clazz.extend(name, obj);
    const fnInit = output.prototype.init;
    const fnAfterInit = output.prototype.afterInit;
    output.prototype.init = function () {
      var _this = this;
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
      if (fnInit) {
        fnInit.apply(this, args);
      }
      if (clazz.registerInstance) {
        clazz.registerInstance(this);
      }
      this.metadata = obj.metadata;
      if (obj.metadata.properties) {
        const aPropertyKeys = Object.keys(obj.metadata.properties);
        aPropertyKeys.forEach(propertyKey => {
          const propertyDef = obj.metadata.properties[propertyKey];
          // If a value was set in `init` we need to make sure it is set in the value in the end
          const propertyDefault = this[propertyKey] ?? propertyDef.defaultValue;
          if (propertyDef.isBindingInfo === true) {
            this._bindingProperties ??= {};
            Object.defineProperty(this, propertyKey, {
              configurable: true,
              set: v => {
                this._bindingProperties[propertyKey] = v;
                this.mProperties[propertyKey] = v;
                return this;
              },
              get() {
                // Special case we need to consider the property first and not just the _bindingProperties
                // During the initialization, if the property is set with a non binding value, setProperty is called and not bindProperty
                const propertyValue = this.getProperty(propertyKey);
                const bindingPropertyValue = this._bindingProperties[propertyKey];
                // If the property is set to a different value we update the _bindingProperties
                if (propertyValue !== undefined && propertyValue !== bindingPropertyValue) {
                  this._bindingProperties[propertyKey] = propertyValue;
                }
                const propValue = this._bindingProperties[propertyKey];
                if (typeof propValue === "object") {
                  return {
                    ...propValue
                  }; // Create shallow copy
                } else {
                  return propValue;
                }
              }
            });
          } else {
            Object.defineProperty(this, propertyKey, {
              configurable: true,
              set: v => {
                return this.setProperty(propertyKey, v);
              },
              get: () => {
                return this.getProperty(propertyKey);
              }
            });
          }
          if (propertyDefault !== undefined && this[propertyKey] !== propertyDefault) {
            // don't overwrite the default value if it's already there
            this._applyingSettings = true;
            this[propertyKey] = propertyDefault;
            this._applyingSettings = false;
            delete this._applyingSettings;
          }
        });
        const aAggregationKeys = Object.keys(obj.metadata.aggregations);
        aAggregationKeys.forEach(aggregationKey => {
          const aggregationDef = obj.metadata.aggregations[aggregationKey];
          const defaultValue = this[aggregationKey] ?? aggregationDef.defaultValue;
          Object.defineProperty(this, aggregationKey, {
            configurable: true,
            set: v => {
              return this.setAggregation(aggregationKey, v);
            },
            get: () => {
              const aggregationContent = this.getAggregation(aggregationKey);
              if (obj.metadata.aggregations[aggregationKey].multiple) {
                return aggregationContent || [];
              } else {
                return aggregationContent;
              }
            }
          });
          if (defaultValue && defaultValue?.isA) {
            this._applyingSettings = true;
            this[aggregationKey] = defaultValue;
            this._applyingSettings = false;
            delete this._applyingSettings;
          }
        });
        const aAssociationKeys = Object.keys(obj.metadata.associations);
        aAssociationKeys.forEach(associationKey => {
          Object.defineProperty(this, associationKey, {
            configurable: true,
            set: v => {
              return this.setAssociation(associationKey, v);
            },
            get: () => {
              const aggregationContent = this.getAssociation(associationKey);
              if (obj.metadata.associations[associationKey].multiple) {
                return aggregationContent || [];
              } else {
                return aggregationContent;
              }
            }
          });
        });
      }
      if (obj.metadata.references) {
        const referenceProperties = Object.keys(obj.metadata.references);
        referenceProperties.forEach(propertyKey => {
          Object.defineProperty(this, propertyKey, {
            configurable: true,
            value: createReference()
          });
        });
      }
      if (obj.metadata.methods) {
        for (const methodName in obj.metadata.methods) {
          const methodDefinition = obj.metadata.methods[methodName];
          if (methodDefinition.overrideExecution === "AfterAsync" || methodDefinition.overrideExecution === "BeforeAsync") {
            if (!this.methodHolder) {
              this.methodHolder = [];
            }
            this.methodHolder[methodName] = [this[methodName]];
            Object.defineProperty(this, methodName, {
              configurable: true,
              set: v => {
                return this.methodHolder[methodName].push(v);
              },
              get: () => {
                return async function () {
                  const methodArrays = _this.methodHolder[methodName];
                  if (methodDefinition.overrideExecution === "BeforeAsync") {
                    methodArrays.reverse();
                  }
                  let result;
                  for (var _len3 = arguments.length, methodArgs = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                    methodArgs[_key3] = arguments[_key3];
                  }
                  for (const arg of methodArrays) {
                    result = await arg.apply(_this, methodArgs);
                  }
                  return result;
                };
              }
            });
          }
        }
      }
      _createStateProperty(obj, this);
      if (fnAfterInit) {
        fnAfterInit.apply(this, args);
      }
    };
    clazz.override = function (oExtension) {
      const pol = {};
      pol.constructor = function () {
        for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          args[_key4] = arguments[_key4];
        }
        return clazz.apply(this, args);
      };
      const oClass = Metadata.createClass(clazz, `anonymousExtension~${uid()}`, pol, ControllerMetadata);
      oClass.getMetadata()._staticOverride = oExtension;
      oClass.getMetadata()._override = clazz.getMetadata()._override;
      return oClass;
    };
    ObjectPath.set(name, output);
    return output;
  }
  return _exports;
}, false);
//# sourceMappingURL=ClassSupport-dbg.js.map
