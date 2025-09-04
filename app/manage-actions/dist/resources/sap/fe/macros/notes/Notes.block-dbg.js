/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase", "sap/ui/core/Lib"], function (Log, BuildingBlockSupport, BuildingBlockTemplateProcessor, BuildingBlockTemplatingBase, Library) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var _exports = {};
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let NotesBuildingBlock = (_dec = defineBuildingBlock({
    name: "Notes",
    namespace: "sap.fe.macros",
    libraries: ["sap/nw/core/gbt/notes/lib/reuse"]
  }), _dec2 = blockAttribute({
    type: "string",
    isPublic: true,
    required: true
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true,
    required: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockTemplat) {
    function NotesBuildingBlock() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BuildingBlockTemplat.call(this, ...args) || this;
      /**
       * The 'id' property
       */
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      /**
       * The context path provided for the field
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _this);
      return _this;
    }
    _exports = NotesBuildingBlock;
    _inheritsLoose(NotesBuildingBlock, _BuildingBlockTemplat);
    NotesBuildingBlock.load = async function load() {
      if (this.metadata.libraries) {
        // Required before usage to ensure the library is loaded and not each file individually
        try {
          await Promise.all(this.metadata.libraries.map(async libraryName => Library.load({
            name: libraryName
          })));
        } catch (e) {
          const errorMessage = `Couldn't load building block ${this.metadata.name} please make sure the following libraries are available ${this.metadata.libraries.join(",")}`;
          Log.error(errorMessage);
          throw new Error(errorMessage);
        }
      }
      return Promise.resolve(this);
    };
    var _proto = NotesBuildingBlock.prototype;
    _proto.getTemplate = async function getTemplate() {
      // Required before usage to ensure the library is loaded and not each file individually
      try {
        await NotesBuildingBlock.load();
      } catch (e) {
        return xml`<m:Label text="${e}"/>`;
      }
      return xml`<fpm:CustomFragment xmlns:fpm="sap.fe.macros.fpm" id="${this.id}" contextPath="{contextPath>}" fragmentName="sap.nw.core.gbt.notes.lib.reuse.fe.fragment.NoteList"/>`;
    };
    return NotesBuildingBlock;
  }(BuildingBlockTemplatingBase), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = NotesBuildingBlock;
  return _exports;
}, false);
//# sourceMappingURL=Notes.block-dbg.js.map
