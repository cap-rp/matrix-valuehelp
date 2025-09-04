/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/controllerextensions/BusyLocker", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/macros/situations/SituationsText", "sap/m/Button", "sap/m/CustomListItem", "sap/m/HBox", "sap/m/Label", "sap/m/List", "sap/m/ObjectIdentifier", "sap/m/ObjectStatus", "sap/m/ResponsivePopover", "sap/m/Text", "sap/m/Toolbar", "sap/m/VBox"], function (BusyLocker, ResourceModelHelper, SituationsText, Button, CustomListItem, HBox, Label, List, ObjectIdentifier, ObjectStatus, ResponsivePopover, Text, Toolbar, VBox) {
  "use strict";

  var _exports = {};
  var bindText = SituationsText.bindText;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  function bindTimestamp(timestampPropertyPath) {
    return {
      path: timestampPropertyPath,
      type: "sap.ui.model.odata.type.DateTimeOffset",
      constraints: {
        precision: 7
      },
      formatOptions: {
        relative: true
      }
    };
  }
  let currentSituationIndicator;
  function createListPopover(controller, expectedNumberOfSituations) {
    let listDetailsPopover = null;
    const listPopover = new ResponsivePopover({
      showHeader: false,
      contentHeight: `${expectedNumberOfSituations * 4.5}em`,
      contentWidth: "25em",
      busyIndicatorDelay: 200,
      placement: "Horizontal",
      content: [new List({
        items: {
          path: "_Instance",
          events: {
            dataReceived: () => {
              listPopover.setContentHeight();
            }
          },
          parameters: {
            $orderby: "SitnInstceLastChgdAtDateTime desc",
            $expand: "_InstanceAttribute($expand=_InstanceAttributeValue)" // required for formatting the texts
          },
          template: new CustomListItem({
            type: "Navigation",
            press: goToDetails,
            content: [new HBox({
              items: [new ObjectStatus({
                icon: "sap-icon://alert",
                state: "Warning",
                tooltip: getResourceModel(controller).getText("situation")
              }).addStyleClass("sapUiTinyMarginEnd"), new ObjectIdentifier({
                title: bindText("SituationTitle"),
                text: bindTimestamp("SitnInstceLastChgdAtDateTime")
              })]
            }).addStyleClass("sapUiSmallMarginBeginEnd").addStyleClass("sapUiSmallMarginTopBottom")]
          }),
          templateShareable: false
        },
        showNoData: false
      })]
    });
    function goToList() {
      if (listDetailsPopover) {
        listDetailsPopover.unbindObject();
        listDetailsPopover.close();
      }
      if (currentSituationIndicator) {
        listPopover.openBy(currentSituationIndicator);
      }
    }
    async function goToDetails(event) {
      const pressedItem = event.getSource();
      const context = pressedItem.getBindingContext();
      if (context && currentSituationIndicator) {
        if (listDetailsPopover === null) {
          listDetailsPopover = await createPreviewPopover(controller, goToList);
          controller.getView().addDependent(listDetailsPopover);
        }
        listDetailsPopover.bindElement({
          path: context.getPath(),
          parameters: {
            $expand: "_InstanceAttribute($expand=_InstanceAttributeValue)"
          },
          events: {
            dataReceived: () => {
              BusyLocker.unlock(listDetailsPopover);
            }
          }
        });
        listPopover.close();
        BusyLocker.lock(listDetailsPopover);
        listDetailsPopover.openBy(currentSituationIndicator);
      }
    }
    return listPopover;
  }
  async function createPreviewPopover(controller, back) {
    const toolBarContent = [];
    const resourceModel = getResourceModel(controller);
    if (back) {
      toolBarContent.push(new Button({
        type: "Back",
        tooltip: resourceModel.getText("back"),
        press: back
      }).addStyleClass("sapUiNoMarginEnd"));
    }
    toolBarContent.push(new ObjectStatus({
      state: "Warning",
      icon: "sap-icon://alert",
      tooltip: resourceModel.getText("situationIconTooltip")
    }).addStyleClass("sapUiSmallMarginBegin"));
    toolBarContent.push(new ObjectIdentifier({
      titleActive: false,
      title: bindText("SituationTitle")
    }).addStyleClass("sapUiSmallMarginEnd"));
    const popoverSettings = {
      contentWidth: "25em",
      contentHeight: "7em",
      placement: "Horizontal",
      customHeader: new Toolbar({
        content: toolBarContent
      }),
      busyIndicatorDelay: 100,
      content: [new VBox({
        items: [new Label({
          text: bindTimestamp("SitnInstceLastChgdAtDateTime")
        }), new Text({
          text: bindText("SituationText")
        }).addStyleClass("sapUiTinyMarginTop")]
      })]
    };
    const shellServices = controller.getAppComponent().getShellServices();
    const navigationArguments = {
      target: {
        action: "displayExtended",
        semanticObject: "SituationInstance"
      }
    };
    const isNavigationSupported = await shellServices.isNavigationSupported([navigationArguments]);
    if (isNavigationSupported[0].supported) {
      popoverSettings.endButton = new Button({
        text: resourceModel.getText("showDetails"),
        press: event => {
          const situationKey = event.getSource().getBindingContext()?.getObject(`SitnInstceKey`);
          if (situationKey !== undefined && situationKey !== null) {
            navigationArguments.params = {
              SitnInstceKey: situationKey
            };
            shellServices.toExternal(navigationArguments);
          }
        }
      });
    }
    return new ResponsivePopover(popoverSettings).addStyleClass("sapUiPopupWithPadding").addStyleClass("sapUiResponsivePadding--header");
  }
  async function showPopover(controller, event, situationsNavigationProperty) {
    currentSituationIndicator = event.getSource();
    const bindingContext = currentSituationIndicator.getBindingContext(),
      numberOfSituations = bindingContext.getObject(`${situationsNavigationProperty}/SitnNumberOfInstances`);
    let popover;
    const context = bindingContext.getModel().bindContext(situationsNavigationProperty, bindingContext, {
      $expand: "_Instance($expand=_InstanceAttribute($expand=_InstanceAttributeValue))"
    }).getBoundContext();
    if (numberOfSituations <= 1) {
      popover = await createPreviewPopover(controller);
      popover.setBindingContext(context);
      popover.bindElement({
        path: "_Instance/0"
      });
    } else {
      popover = createListPopover(controller, numberOfSituations);
      popover.setBindingContext(context);
    }
    controller.getView().addDependent(popover);
    popover.openBy(currentSituationIndicator);
  }
  _exports.showPopover = showPopover;
  showPopover.__functionName = "rt.showPopover";
  return _exports;
}, false);
//# sourceMappingURL=SituationsPopover-dbg.js.map
