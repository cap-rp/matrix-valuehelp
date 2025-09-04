/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/base/EventDelegateHook", "sap/fe/base/jsx-runtime/jsx", "sap/fe/controls/easyFilter/ShellHistoryProvider", "sap/m/Button", "sap/m/CustomListItem", "sap/m/FlexBox", "sap/m/HBox", "sap/m/IllustratedMessage", "sap/m/IllustratedMessageSize", "sap/m/IllustratedMessageType", "sap/m/Input", "sap/m/List", "sap/m/Popover", "sap/m/Text", "sap/m/Title", "sap/m/library", "sap/ui/core/Control", "sap/ui/core/CustomData", "sap/ui/core/Lib", "sap/ui/core/library", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (Log, BindingToolkit, ClassSupport, EventDelegateHook, jsx, ShellHistoryProvider, Button, CustomListItem, FlexBox, HBox, IllustratedMessage, IllustratedMessageSize, IllustratedMessageType, Input, List, Popover, Text, Title, library, Control, CustomData, Lib, coreLibrary, _jsx, _jsxs) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7;
  var _exports = {};
  var ValueState = coreLibrary.ValueState;
  var TitleLevel = coreLibrary.TitleLevel;
  var PlacementType = library.PlacementType;
  var ListMode = library.ListMode;
  var FlexWrap = library.FlexWrap;
  var FlexJustifyContent = library.FlexJustifyContent;
  var FlexDirection = library.FlexDirection;
  var FlexAlignItems = library.FlexAlignItems;
  var ButtonType = library.ButtonType;
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var defineState = ClassSupport.defineState;
  var aggregation = ClassSupport.aggregation;
  var lessThan = BindingToolkit.lessThan;
  var length = BindingToolkit.length;
  var equal = BindingToolkit.equal;
  var bindState = BindingToolkit.bindState;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let EasyFilterInput = (_dec = defineUI5Class("sap.fe.controls.easyFilter.EasyFilterInput"), _dec2 = aggregation({
    type: "sap.m.Input",
    multiple: false,
    isDefault: true
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "array"
  }), _dec5 = event(), _dec6 = event(), _dec7 = event(), _dec8 = defineState(), _dec(_class = (_class2 = /*#__PURE__*/function (_Control) {
    function EasyFilterInput(properties, others) {
      var _this;
      _this = _Control.call(this, properties, others) || this;
      _initializerDefineProperty(_this, "$searchInput", _descriptor, _this);
      _initializerDefineProperty(_this, "appId", _descriptor2, _this);
      _initializerDefineProperty(_this, "recommendedValues", _descriptor3, _this);
      _initializerDefineProperty(_this, "queryChanged", _descriptor4, _this);
      _initializerDefineProperty(_this, "enterPressed", _descriptor5, _this);
      _initializerDefineProperty(_this, "liveChange", _descriptor6, _this);
      _initializerDefineProperty(_this, "state", _descriptor7, _this);
      _this.initialize();
      return _this;
    }
    _exports = EasyFilterInput;
    _inheritsLoose(EasyFilterInput, _Control);
    var _proto = EasyFilterInput.prototype;
    _proto.getValue = function getValue() {
      return this.$searchInput.getValue();
    };
    _proto.isHistoryEnabled = function isHistoryEnabled() {
      return this.state.isHistoryEnabled.valueOf();
    };
    _proto.setValue = function setValue(value) {
      this.$searchInput.setValue(value);
      return this;
    };
    _proto.setPlaceholder = function setPlaceholder(value) {
      this.$searchInput.setPlaceholder(value);
      return this;
    };
    _proto.getPlaceholder = function getPlaceholder() {
      return this.$searchInput.getPlaceholder();
    };
    _proto.initialize = function initialize() {
      this.state.recommendedQueries = this.recommendedValues ?? [];
      this.resourceBundle = Lib.getResourceBundleFor("sap.fe.controls");
      this.createInput();
    };
    _proto.setAsInvalid = function setAsInvalid(message) {
      this.$searchInput.setValueState(ValueState.Warning);
      this.$searchInput.setValueStateText(message);
      this.$searchInput.openValueStateMessage();
    };
    _proto.createInput = function createInput() {
      this.$searchInput = _jsx(Input, {
        width: "100%",
        showClearIcon: true,
        change: e => {
          this.fireEvent("queryChanged", {
            query: e.getParameter("value")
          });
        },
        liveChange: e => {
          this.state.queryChanged = true;
          this.fireEvent("liveChange");
          if (!e.getSource().getValue() && !(this.$favoritePopover?.isOpen() ?? false)) {
            this.openSuggestionPopover();
          }
          if (e.getParameter("value") === "") {
            this.setPlaceholder(this.resourceBundle.getText("M_EASY_FILTER_PLACEHOLDER"));
          }
        },
        placeholder: this.resourceBundle.getText("M_EASY_FILTER_PLACEHOLDER")
      });
      const favoritePopover = this.createFavoritePopover();
      this.$favoritePopover = favoritePopover;
      this.$searchInput.addDependent(favoritePopover);
      this.$searchInput.addEventDelegate({
        onkeyup: e => {
          if (e.key === "Enter") {
            this.onEnterPressed();
          }
          if (this.$favoritePopover && this.$searchInput.getValue()) {
            this.$favoritePopover.close();
          }
        },
        onkeydown: e => {
          if (e.key === "Tab" && this.$searchInput?.getValue().length === 0 && this.$searchInput?.getValue() !== this.$searchInput?.getPlaceholder() && this.$searchInput?.getPlaceholder() !== this.resourceBundle.getText("M_EASY_FILTER_PLACEHOLDER")) {
            e.preventDefault();
            this.$searchInput?.setValue(this.$searchInput?.getPlaceholder());
            this.fireEvent("liveChange");
          }
        },
        ontap: () => {
          this.openSuggestionPopover();
        },
        onfocusin: () => {
          this.openSuggestionPopover();
        }
      });
    };
    _proto.openSuggestionPopover = function openSuggestionPopover() {
      if (!this.$searchInput?.getValue() && (!this.$favoritePopover || !this.$favoritePopover?.isOpen())) {
        // Open the easy filter popover
        this.state.isHistoryEnabled = this.shellHistoryProvider?.isHistoryEnabled() ?? false;
        this.state.favoriteQueries = this.shellHistoryProvider?.getFavoriteQueries() ?? [];
        this.state.recentQueries = (this.shellHistoryProvider?.getRecentQueries() ?? []).map(query => query);
        this.$favoritePopover?.openBy(this.$searchInput);
      }
    };
    _proto.requestFavorite = function requestFavorite(e) {
      this.$favoritePopover?.close();
      this.$searchInput?.setValue(e.getSource().getText());
      this.onEnterPressed();
    };
    _proto.onEnterPressed = function onEnterPressed() {
      this.$favoritePopover?.close();
      this.state.queryChanged = false;
      let magicQuery = this.$searchInput?.getValue();
      if (magicQuery === "" && this.$searchInput.getPlaceholder() !== this.resourceBundle.getText("M_EASY_FILTER_PLACEHOLDER")) {
        magicQuery = this.$searchInput.getPlaceholder();
        this.$searchInput?.setValue(magicQuery);
      }
      this.$searchInput?.setValueStateText("");
      this.$searchInput?.setValueState("None");
      this.fireEvent("enterPressed", {
        query: magicQuery
      });
    };
    _proto.addRecentQuery = function addRecentQuery(queryString) {
      // Normalize backslashes before storing
      queryString = queryString?.replace(/\\/g, "\\\\");
      const recentQueryIndex = this.state.recentQueries.findIndex(query => query.toLowerCase() === queryString?.toLowerCase());
      if (queryString && recentQueryIndex === -1) {
        this.state.recentQueries = [queryString].concat(this.state.recentQueries);
        if (this.state.recentQueries.length > 5) {
          this.state.recentQueries = this.state.recentQueries.slice(0, 5);
        }
      } else if (queryString) {
        const recentQueries = this.state.recentQueries.filter(query => query.toLowerCase() !== queryString?.toLowerCase());
        recentQueries.unshift(queryString);
        this.state.recentQueries = recentQueries;
      }
    };
    _proto.onStateChange = function onStateChange() {
      let changedProps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      if (changedProps.includes("favoriteQueries") || changedProps.includes("recentQueries")) {
        this.shellHistoryProvider?.setFavoriteQueries(this.state.favoriteQueries);
        this.shellHistoryProvider?.setRecentQueries(this.state.recentQueries.map(query => query));
        this.state.recentQueriesWitFavorites = this.state.recentQueries.map(recentQuery => {
          return {
            text: recentQuery,
            isFavorite: !!this.state.favoriteQueries.find(favoriteQuery => favoriteQuery === recentQuery)
          };
        });
      }
    };
    _proto.initShellHistoryProvider = async function initShellHistoryProvider() {
      try {
        this.shellHistoryProvider = await ShellHistoryProvider.getInstance(this.appId ?? "<unknownApp>");
      } catch (error) {
        Log.error("Error while creating ShellHistoryProvider for easy filter", error);
      }
    };
    _proto.createFavoritePopover = function createFavoritePopover() {
      return _jsx(Popover, {
        id: this.getId() + "-favoritePopover",
        showHeader: false,
        horizontalScrolling: false,
        placement: PlacementType.Bottom,
        showArrow: false,
        initialFocus: this.$searchInput,
        class: "sapFEControlsPopover",
        visible: this.state.recommendedQueries.length > 0 || equal(bindState(this.state, "isHistoryEnabled"), true),
        children: {
          content: _jsx(FlexBox, {
            direction: FlexDirection.Column,
            class: "sapUiContentPadding",
            renderType: "Bare",
            children: {
              items: [_jsx(Title, {
                titleStyle: TitleLevel.H6,
                text: this.resourceBundle.getText("M_EASY_FILTER_POPOVER_SUGGESTIONS_TITLE"),
                class: "sapFeControlsTitleBorder",
                visible: this.state.recommendedQueries.length > 0
              }), _jsx(HBox, {
                class: "sapUiContentPadding",
                items: bindState(this.state, "recommendedQueries"),
                wrap: FlexWrap.Wrap,
                visible: this.state.recommendedQueries.length > 0,
                children: {
                  items: (id, ctx) => {
                    return _jsx(Button, {
                      class: "sapUiTinyMarginEnd",
                      text: ctx.getObject(),
                      press: this.requestFavorite.bind(this)
                    });
                  }
                }
              }), _jsx(Title, {
                titleStyle: TitleLevel.H6,
                text: this.resourceBundle.getText("M_EASY_FILTER_POPOVER_FAVORITE_TITLE"),
                class: "sapFeControlsTitleBorder",
                visible: equal(bindState(this.state, "isHistoryEnabled"), true)
              }), _jsx(List, {
                items: bindState(this.state, "favoriteQueries"),
                visible: equal(bindState(this.state, "isHistoryEnabled"), true),
                children: {
                  noData: _jsx(IllustratedMessage, {
                    title: this.resourceBundle.getText("M_EASY_FILTER_POPOVER_EMPTY_FAVORITE_TITLE"),
                    illustrationSize: IllustratedMessageSize.ExtraSmall,
                    illustrationType: IllustratedMessageType.NoEntries,
                    description: this.resourceBundle.getText("M_EASY_FILTER_POPOVER_EMPTY_FAVORITE_DESCRIPTION")
                  }),
                  items: (id, ctx) => {
                    return _jsx(CustomListItem, {
                      class: "sapUiSmallMarginBegin",
                      customData: [_jsx(CustomData, {
                        value: ctx.getObject()
                      }, "text")],
                      press: () => {
                        this.$searchInput.setValue(ctx.getObject());
                        this.onEnterPressed();
                      },
                      children: _jsxs(FlexBox, {
                        width: "100%",
                        direction: FlexDirection.Row,
                        alignItems: FlexAlignItems.Center,
                        justifyContent: FlexJustifyContent.SpaceBetween,
                        renderType: "Bare",
                        id: id,
                        children: [_jsx(Text, {
                          text: ctx.getObject(),
                          tooltip: ctx.getObject(),
                          wrapping: false,
                          class: "sapFEControlsPointer",
                          children: {
                            dependents: _jsx(EventDelegateHook, {
                              tap: () => {
                                this.$searchInput?.setValue(ctx.getObject().replace(/\\\\/g, "\\"));
                                this.onEnterPressed();
                              }
                            })
                          }
                        }), _jsx(Button, {
                          icon: "sap-icon://favorite",
                          tooltip: this.resourceBundle.getText("M_EASY_FILTER_FILLED_STAR"),
                          type: ButtonType.Transparent,
                          press: () => {
                            //Retaining the focus on popover doesn't make the popover close on every interaction
                            this.$favoritePopover?.focus();
                            const queryString = ctx.getObject();
                            const index = this.state.favoriteQueries.indexOf(queryString);
                            if (index !== -1) {
                              this.state.favoriteQueries = this.state.favoriteQueries.filter(query => query !== queryString);
                            }
                          }
                        })]
                      })
                    });
                  }
                }
              }), _jsx(Title, {
                titleStyle: TitleLevel.H6,
                text: this.resourceBundle.getText("M_EASY_FILTER_POPOVER_LAST_USED"),
                class: "sapFeControlsTitleBorder",
                visible: equal(bindState(this.state, "isHistoryEnabled"), true)
              }), _jsx(List, {
                items: bindState(this.state, "recentQueriesWitFavorites"),
                visible: equal(bindState(this.state, "isHistoryEnabled"), true),
                mode: ListMode.Delete,
                delete: e => {
                  //Retaining the focus on popover doesn't make the popover close on every interaction
                  this.$favoritePopover?.focus();
                  let queryString = e.getParameter("listItem")?.data("text");
                  if (!queryString) return;
                  // Normalize backslashes before comparing
                  queryString = queryString?.replace(/\\/g, "\\\\");
                  this.state.recentQueries = this.state.recentQueries.filter(query => query !== queryString);
                },
                children: {
                  noData: _jsx(IllustratedMessage, {
                    title: this.resourceBundle.getText("M_EASY_FILTER_POPOVER_EMPTY_LAST_USED_TITLE"),
                    illustrationSize: IllustratedMessageSize.ExtraSmall,
                    illustrationType: IllustratedMessageType.NoEntries,
                    description: this.resourceBundle.getText("M_EASY_FILTER_POPOVER_EMPTY_RECENT_DESCRIPTION")
                  }),
                  items: (id, ctx) => {
                    return _jsx(CustomListItem, {
                      press: () => {
                        this.$searchInput?.setValue(ctx.getObject().text);
                        this.onEnterPressed();
                      },
                      class: "sapUiSmallMarginBegin",
                      customData: [_jsx(CustomData, {
                        value: ctx.getObject().text
                      }, "text")],
                      children: _jsxs(FlexBox, {
                        width: "100%",
                        direction: FlexDirection.Row,
                        alignItems: FlexAlignItems.Center,
                        justifyContent: FlexJustifyContent.SpaceBetween,
                        renderType: "Bare",
                        id: id,
                        children: [_jsx(Text, {
                          text: ctx.getObject().text,
                          tooltip: ctx.getObject().text,
                          wrapping: false,
                          class: "sapFEControlsPointer",
                          children: {
                            dependents: _jsx(EventDelegateHook, {
                              tap: () => {
                                this.$searchInput?.setValue(ctx.getObject().text.replace(/\\\\/g, "\\"));
                                this.onEnterPressed();
                              }
                            })
                          }
                        }), _jsx(Button, {
                          icon: ctx.getObject().isFavorite ? "sap-icon://favorite" : "sap-icon://add-favorite",
                          tooltip: ctx.getObject().isFavorite ? this.resourceBundle.getText("M_EASY_FILTER_FILLED_STAR") : this.resourceBundle.getText("M_EASY_FILTER_EMPTY_START"),
                          enabled: lessThan(length(bindState(this.state, "favoriteQueries")), 5),
                          type: ButtonType.Transparent,
                          press: () => {
                            //Retaining the focus on popover doesn't make the popover close on every interaction
                            this.$favoritePopover?.focus();
                            const queryString = ctx.getObject().text;
                            const isFavorite = ctx.getObject().isFavorite;
                            if (isFavorite) {
                              this.removeFromFavorites(queryString);
                            } else {
                              this.addToFavorites(queryString);
                            }
                          }
                        })]
                      })
                    });
                  }
                }
              })]
            }
          })
        }
      });
    };
    _proto.removeFromFavorites = function removeFromFavorites(query) {
      this.state.favoriteQueries = this.state.favoriteQueries.filter(data => data.toLowerCase() !== query.toLowerCase());
    };
    _proto.addToFavorites = function addToFavorites(query) {
      const newFavorite = [query].concat(this.state.favoriteQueries.concat());
      if (newFavorite.length > 5) {
        newFavorite.pop();
      }
      this.state.favoriteQueries = newFavorite;
    };
    EasyFilterInput.render = function render(rm, control) {
      return jsx.renderUsingRenderManager(rm, control, () => {
        return _jsx("span", {
          ref: control,
          class: "sapFEEasyFilterInput",
          children: control.$searchInput
        });
      });
    };
    return EasyFilterInput;
  }(Control), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "$searchInput", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "appId", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "recommendedValues", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "queryChanged", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "enterPressed", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "liveChange", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "state", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return {
        queryChanged: false,
        isHistoryEnabled: false,
        recentQueries: [],
        recentQueriesWitFavorites: [],
        favoriteQueries: [],
        recommendedQueries: []
      };
    }
  }), _class2)) || _class);
  _exports = EasyFilterInput;
  return _exports;
}, false);
//# sourceMappingURL=EasyFilterInput-dbg.js.map
