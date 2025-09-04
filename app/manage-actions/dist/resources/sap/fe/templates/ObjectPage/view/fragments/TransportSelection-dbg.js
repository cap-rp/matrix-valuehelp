/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/base/HookSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/FieldControlHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/field/FieldTemplating", "sap/m/Link", "sap/m/MessageStrip", "sap/ui/core/message/MessageType", "sap/fe/base/jsx-runtime/jsx"], function (BindingToolkit, ClassSupport, HookSupport, BuildingBlock, BindingHelper, DataModelPathHelper, FieldControlHelper, UIFormatters, FieldTemplating, Link, MessageStrip, MessageType, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor;
  var _exports = {};
  var getTextBindingExpression = FieldTemplating.getTextBindingExpression;
  var getActionEnabledExpression = UIFormatters.getActionEnabledExpression;
  var isRequiredExpression = FieldControlHelper.isRequiredExpression;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var UI = BindingHelper.UI;
  var controllerExtensionHandler = HookSupport.controllerExtensionHandler;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var pathInModel = BindingToolkit.pathInModel;
  var not = BindingToolkit.not;
  var ifElse = BindingToolkit.ifElse;
  var concat = BindingToolkit.concat;
  var and = BindingToolkit.and;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let TransportSelection = (_dec = defineUI5Class("sap.fe.templates.ObjectPage.view.fragments.TransportSelection"), _dec2 = property({
    type: "boolean"
  }), _dec3 = controllerExtensionHandler("editFlow", "onBeforeSave"), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    // Reference to the message strip

    // the selectTransport action enablement

    // data model object path to the transport property

    function TransportSelection(props, others) {
      var _this;
      _this = _BuildingBlock.call(this, props, others) || this;
      // The transport selection definition
      // a flag to indicate the leading control, also taking care on validating on safe
      _initializerDefineProperty(_this, "leadingControl", _descriptor, _this);
      return _this;
    }
    _exports = TransportSelection;
    _inheritsLoose(TransportSelection, _BuildingBlock);
    var _proto = TransportSelection.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable(_ownerComponent) {
      _BuildingBlock.prototype.onMetadataAvailable.call(this, _ownerComponent);
      this.content = this.createContent();
    }

    /**
     * Call the selectTransportAction once the user clicks on the link in the message strip.
     * @param actionName The name of the action to be called
     * @returns Promise that is resolved once a transport request was selected
     */;
    _proto.selectTransport = async function selectTransport(actionName) {
      const context = this.getBindingContext();
      const label = this.messageStrip.getLink().getText();
      return this.getPageController()?.editFlow.invokeAction(actionName, {
        contexts: context,
        label: label
      });
    }

    /**
     * Get expression for the message strip type.
     *
     * If mandatory and no transport request is given the type is Warning,
     * otherwise it's Information.
     * @returns Expression to determine the message strip type.
     */;
    _proto.getTypeExpression = function getTypeExpression() {
      const relativePath = getRelativePaths(this.transportPropertyObjectPath);
      const requiredExpression = isRequiredExpression(this.transportPropertyObjectPath.targetObject, relativePath);
      return ifElse(and(requiredExpression, not(pathInModel(this.definition?.transportRequestProperty))), MessageType.Warning, MessageType.Information);
    }

    /**
     * Get expression for the link text.
     *
     * If transport request is given the text shall be change transport, if not
     * it shall be select transport.
     * @returns Expression to determine the link text.
     */;
    _proto.getLinkTextExpression = function getLinkTextExpression() {
      return ifElse(pathInModel(this.definition?.transportRequestProperty), this.getTranslatedText("T_TRANSPORT_SELECTION_CHANGE_TRANSPORT"), this.getTranslatedText("T_TRANSPORT_SELECTION_SELECT_TRANSPORT"));
    }

    /**
     * Get expression for the message strip text.
     *
     * If no transport given we show a warning text, if one is given we show the
     * selected transport request, and also consider the text annotation on the
     * transport request property.
     * @returns Expression to determine the message strip text
     */;
    _proto.getStripText = function getStripText() {
      const textExpression = getTextBindingExpression(this.transportPropertyObjectPath, {});
      const noTransportSelected = this.getTranslatedText("T_TRANSPORT_SELECTION_NO_TRANSPORT_SELECTED");
      const transportSelected = concat(`${this.getTranslatedText("T_TRANSPORT_SELECTION_SELECTED_TRANSPORT")} `, textExpression);
      return ifElse(pathInModel(this.definition?.transportRequestProperty), transportSelected, noTransportSelected);
    }

    /**
     * Get expression for the message strip visibility.
     *
     * If not in edit mode we don't show the message strip at all. If in edit
     * mode we check the OperationAvailable annotation on the selectTransportAction.
     * @returns Expression to determine the  message strip visibility
     */;
    _proto.getStripVisible = function getStripVisible() {
      // The visibility of the strip relies on the Core.OperationAvailable set on the transport select action
      return ifElse(this.actionEnabledExpression, UI.IsEditable, false);
    }

    /**
     * Get the message strip to be shown in the object page header.
     * @returns Message strip or nothing in case the feature is not enabled
     */;
    _proto.createContent = function createContent() {
      const dataModelObjects = this.getDataModelObjectPath();
      this.definition = this.getManifestWrapper()?.getTransportSelection();
      if (this.definition) {
        let selectTransportAction = dataModelObjects?.targetEntityType.actions[this.definition.selectTransportAction];
        if (!selectTransportAction) {
          // if the action wasn't found give it a try by adding the namespace
          selectTransportAction = dataModelObjects?.targetEntityType.actions[`${dataModelObjects?.convertedTypes.namespace}.${this.definition.selectTransportAction}`];
        }
        if (dataModelObjects && selectTransportAction) {
          this.actionEnabledExpression = getActionEnabledExpression(selectTransportAction, dataModelObjects?.convertedTypes, dataModelObjects);
          this.transportPropertyObjectPath = enhanceDataModelPath(dataModelObjects, this.definition.transportRequestProperty);
          this.messageStrip = _jsx(MessageStrip, {
            text: this.getStripText(),
            type: this.getTypeExpression(),
            showIcon: "true",
            customIcon: "sap-icon://shipping-status",
            class: "sapUiSmallMarginTop",
            visible: this.getStripVisible(),
            children: {
              link: _jsx(Link, {
                press: this.selectTransport.bind(this, selectTransportAction.fullyQualifiedName),
                text: this.getLinkTextExpression()
              })
            }
          });
          return this.messageStrip;
        }
      }
    }

    /**
     * Show selectTransport dialog if no transport chosen.
     *
     * We check if the TransportSelection feature is enabled and if the message strip
     * type is warning (= mandatory but no transport request chosen). If so we show the selectTransport dialog.
     * @returns Promise that is resolved once a transport request was selected
     */;
    _proto.validateTransportRequestBeforeSave = async function validateTransportRequestBeforeSave() {
      if (this.messageStrip.getVisible() && this.messageStrip.getType() === MessageType.Warning && this.leadingControl && this.definition) {
        return this.selectTransport(this.definition?.selectTransportAction);
      }
      return Promise.resolve();
    };
    return TransportSelection;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "leadingControl", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _applyDecoratedDescriptor(_class2.prototype, "validateTransportRequestBeforeSave", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "validateTransportRequestBeforeSave"), _class2.prototype), _class2)) || _class);
  _exports = TransportSelection;
  return _exports;
}, false);
//# sourceMappingURL=TransportSelection-dbg.js.map
