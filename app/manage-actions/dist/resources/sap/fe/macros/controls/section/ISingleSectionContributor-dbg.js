/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  /**
   * Definition of data provided by section to single control
   * @public
   */
  /**
   * Definition of data consumer by section from single control
   * @public
   */
  /**
   * This interface should be implemented by controls to define it's behaviour
   * when it is the only control in a Fiori Elements Object Page Section.<br/>
   * <br/>
   * The Fiori Elements Object Page Section checks if it has only one control at runtime and then
   * calls the relevant methods if the control implements the interface.<br/>
   * <br/>
   * Incase of a composite control or controls placed inside layouts (VBox, HBox, FlexBox) etc. it should always be the root/layout control that implements this interface.
   * It is upto the root/layout contrl in this case of interact with inner controls.<br/>
   * <br/>
   * Control must implement getSectionContentRole to define whether it is a "provider" or a "consumer". <br/>
   * <br/>    - provider: Building block is the provider of information to the section
   * <br/>    - consumer: Building block is the consumer of information provided by the section<br/>
   * <br/>
   * If the control is a "provider" then it should implement the getDataFromProvider method and return ProviderData. <br/>
   * If the control is a "consumer" then it should implement the sendDataToConsumer method and consume ConsumerData. <br/>
   * @public
   * @since 1.126.0
   */
}, false);
//# sourceMappingURL=ISingleSectionContributor-dbg.js.map
