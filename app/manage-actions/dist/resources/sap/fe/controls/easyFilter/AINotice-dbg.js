/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/m/Button", "sap/m/OverflowToolbar", "sap/m/Popover", "sap/m/Text", "sap/m/ToolbarSpacer", "sap/m/VBox", "sap/m/library", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs", "sap/fe/base/jsx-runtime/Fragment"], function (Button, OverflowToolbar, Popover, Text, ToolbarSpacer, VBox, library, _jsx, _jsxs, _Fragment) {
  "use strict";

  var PlacementType = library.PlacementType;
  var ButtonType = library.ButtonType;
  /**
   * Tiny component to display a link that opens a popover with the AI notice.
   * @param props
   * @param props.resourceBundle
   * @returns The AI Notice component
   */
  function AINotice(props) {
    return _jsx(Button, {
      text: props.resourceBundle.getText("M_EASY_FILTER_FILTER_SET_AI"),
      icon: "sap-icon://ai",
      type: ButtonType.Transparent,
      press: e => {
        const $disclaimerPopover = _jsx(Popover, {
          contentWidth: "22.8125rem",
          showArrow: true,
          showHeader: true,
          placement: PlacementType.Bottom,
          title: props.resourceBundle.getText("M_EASY_FILTER_POPOVER_AI_TITLE"),
          children: {
            content: _jsxs(VBox, {
              children: [_jsx(Text, {
                class: "sapFeControlsAiPopoverText1",
                text: props.resourceBundle.getText("M_EASY_FILTER_POPOVER_AI_TEXT_1")
              }), _jsx(Text, {
                class: "sapFeControlsAiPopoverText2",
                text: props.resourceBundle.getText("M_EASY_FILTER_POPOVER_AI_TEXT_2")
              })]
            }),
            footer: _jsx(OverflowToolbar, {
              children: {
                content: _jsxs(_Fragment, {
                  children: [_jsx(ToolbarSpacer, {}), _jsx(Button, {
                    text: props.resourceBundle.getText("M_EASY_FILTER_POPOVER_CLOSE"),
                    press: () => {
                      $disclaimerPopover?.close();
                    }
                  })]
                })
              }
            })
          }
        });
        $disclaimerPopover.openBy(e.getSource());
      }
    });
  }
  return AINotice;
}, false);
//# sourceMappingURL=AINotice-dbg.js.map
