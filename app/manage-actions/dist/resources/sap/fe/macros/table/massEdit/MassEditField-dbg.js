/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/controls/Any", "sap/fe/core/helpers/StableIdHelper", "sap/fe/macros/Field", "sap/fe/macros/table/massEdit/library", "sap/m/Select", "sap/ui/core/Item", "sap/ui/mdc/enums/FieldEditMode", "../../field/FieldRuntimeHelper", "sap/fe/base/jsx-runtime/jsx"], function (BindingToolkit, Any, ID, Field, library, Select, Item, FieldEditMode, FieldRuntimeHelper, _jsx) {
  "use strict";

  var _exports = {};
  var SpecificSelectKeys = library.SpecificSelectKeys;
  var isConstant = BindingToolkit.isConstant;
  var compileExpression = BindingToolkit.compileExpression;
  var compileConstant = BindingToolkit.compileConstant;
  let MassEditField = /*#__PURE__*/function () {
    /**
     * Constructor of the MassEdit field.
     * @param properties The field properties
     * @param context Defines the Odata metamodel context used in the current MassEdit dialog
     */
    function MassEditField(properties, context) {
      this.isValid = true;
      this.properties = properties;
      this.context = context;
      this.context = context;
      this.select = this.createSelect();
      this.field = this.createField();
    }

    /**
     * Gets the inner controls.
     * @returns The controls
     */
    _exports = MassEditField;
    var _proto = MassEditField.prototype;
    _proto.getControls = function getControls() {
      const controls = [this.select];
      if (this.field) {
        controls.push(this.field);
      }
      return controls;
    }

    /**
     * Gets the property and unit values of the mass edit field.
     * @returns The values
     */;
    _proto.getFieldValues = function getFieldValues() {
      const selectedKey = this.select.getSelectedKey();
      const selectedItem = this.properties.selectItems.find(item => selectedKey === item.key);
      const values = {};
      let propertyValue = "";
      let propertyUnitValue = "";
      const bindingValue = this.field?.getBindingContext()?.getProperty(this.properties.propertyInfo.relativePath);
      if (!this.select.getParent()?.getVisible() || !selectedItem) {
        return {};
      }
      switch (selectedItem.key) {
        case SpecificSelectKeys.ClearFieldValueKey:
          propertyValue = this.getFormattedValue(bindingValue);
          break;
        case SpecificSelectKeys.ReplaceKey:
          if (this.field) {
            /**
             * If the value on the field comes from an existing entry into the select
             * the value to use is not the one into the bindingContext since it could contain the description
             * so FE has to retrieve the value from the select option.
             */
            const unitOrCurrencyValue = this.properties.propertyInfo.unitOrCurrencyPropertyPath ? this.field.getBindingContext()?.getProperty(this.properties.propertyInfo.unitOrCurrencyPropertyPath) : undefined;
            const selectOptions = this.properties.selectItems.find(item => this.properties.propertyInfo.unitOrCurrencyPropertyPath && item.propertyValue === bindingValue && item.unitOrCurrencyValue === unitOrCurrencyValue || !this.properties.propertyInfo.unitOrCurrencyPropertyPath && item.text === bindingValue);
            const newValue = selectOptions?.propertyValue ?? bindingValue;
            const newPropertyValue = selectOptions?.unitOrCurrencyValue ?? unitOrCurrencyValue;
            if (newValue === null && newPropertyValue === null) {
              return {}; // If the Field is empty we don't want to update the value
            }
            propertyValue = this.getFormattedValue(newValue);
            propertyUnitValue = newPropertyValue;
          }
          break;
        case SpecificSelectKeys.KeepKey:
          return {};
        default:
          if (this.properties.inputType === "CheckBox") {
            propertyValue = this.getFormattedValue(selectedItem.key);
          } else {
            return {};
          }
          break;
      }
      values[this.properties.propertyInfo.relativePath] = propertyValue;
      if (this.properties.propertyInfo.unitOrCurrencyPropertyPath) {
        values[this.properties.propertyInfo.unitOrCurrencyPropertyPath] = propertyUnitValue;
      }
      return values;
    }

    /**
     * Checks if the targeted property is read only on the specified context.
     * @param context The row context
     * @returns True if the field is readonly on this context, false otherwise.
     */;
    _proto.isReadOnlyOnContext = function isReadOnlyOnContext(context) {
      const readOnlyInfo = this.properties.readOnlyExpression;
      let isReadOnly = false;
      if (isConstant(readOnlyInfo)) {
        isReadOnly = compileConstant(readOnlyInfo, false, undefined, true);
      } else {
        // We evaluate the value of the expression via a UI5 managed object instance.
        const anyObject = new Any({
          anyBoolean: compileExpression(readOnlyInfo)
        });
        anyObject.setModel(context.getModel());
        anyObject.setBindingContext(context);
        isReadOnly = anyObject.getBinding("anyBoolean")?.getExternalValue();
        anyObject.destroy();
      }
      return isReadOnly;
    }

    /**
     * Gets the formatted value.
     * @param value The raw value
     * @returns The formatted value.
     */;
    _proto.getFormattedValue = function getFormattedValue(value) {
      if (this.properties.inputType === "CheckBox") {
        return value === "true";
      }
      return value ?? this.properties.propertyInfo.emptyValue;
    }

    /**
     * Create the inner field.
     * @returns The field if needed, undefined otherwise.
     */;
    _proto.createField = function createField() {
      if (this.properties.inputType !== "CheckBox") {
        return _jsx(Field, {
          contextPath: this.context,
          metaPath: this.properties.propertyInfo.relativePath,
          id: ID.generate(["MED_", this.properties.propertyInfo.key, "_Field"]),
          editMode: FieldEditMode.Editable,
          visible: false,
          change: this.handleFieldChange.bind(this)
        });
      }
    };
    _proto.handleFieldChange = function handleFieldChange(event) {
      this.isValid = !!FieldRuntimeHelper.getFieldStateOnChange(event).state["validity"];
    };
    _proto.isFieldValid = function isFieldValid() {
      return this.isValid;
    }

    /**
     * Create the inner select.
     * @returns The select.
     */;
    _proto.createSelect = function createSelect() {
      return _jsx(Select, {
        id: ID.generate(["MED_", this.properties.propertyInfo.key]),
        items: this.properties.selectItems.map(selectItem => _jsx(Item, {
          text: selectItem.text
        }, selectItem.key)),
        required: this.properties.isFieldRequired,
        change: this.handleSelectionChange.bind(this),
        width: "100%",
        ariaLabelledBy: [ID.generate(["MED_", this.properties.propertyInfo.key, "Label"])]
      });
    }

    /**
     * Manages the selection change through the drop down.
     */;
    _proto.handleSelectionChange = function handleSelectionChange() {
      const selectedItem = this.select.getSelectedItem();
      if (this.field && selectedItem) {
        this.isValid = true;
        const bindingContext = this.field.getBindingContext();
        const key = selectedItem.getKey();
        let selectedValue;
        this.field.setVisible(![SpecificSelectKeys.KeepKey, SpecificSelectKeys.ClearFieldValueKey].includes(selectedItem.getKey()));
        if (!(key in SpecificSelectKeys)) {
          selectedValue = this.properties.selectItems.find(item => item.key === key);
          this.select.setSelectedKey(SpecificSelectKeys.ReplaceKey);
        }
        /**
         * Sets the value on the field.
         * This value has to include the description if needed.
         */
        if (bindingContext) {
          const uniPropertyPath = this.properties.propertyInfo.unitOrCurrencyPropertyPath;
          bindingContext.setProperty(this.properties.propertyInfo.relativePath, this.properties.descriptionPath ? selectedValue?.text : selectedValue?.propertyValue);
          if (uniPropertyPath) {
            bindingContext.setProperty(uniPropertyPath, selectedValue?.unitOrCurrencyValue);
          }
        }
      }
    };
    return MassEditField;
  }();
  _exports = MassEditField;
  return _exports;
}, false);
//# sourceMappingURL=MassEditField-dbg.js.map
