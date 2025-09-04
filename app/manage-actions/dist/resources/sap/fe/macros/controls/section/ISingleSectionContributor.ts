/**
 * Definition of data provided by section to single control
 * @public
 */
export type ProviderData = {
	/**
	 * Defines the title to be used by the section.
	 * @public
	 */
	title: string;
	titleLevel?: string;
};
/**
 * Definition of data consumer by section from single control
 * @public
 */
export type ConsumerData = {
	/**
	 * Defines the title to be used by the single control.
	 * @public
	 */
	title: string;
	titleLevel?: string;
	headerStyle?: string;
};
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
export default interface ISingleSectionContributor {
	__implements__sap_fe_macros_controls_section_ISingleSectionContributor: boolean;
	/**
	 * Defines the role of a control when it is the only content in the section. Allowed roles are "provider" and "consumer".<br/>
	 * <br/>
	 * provider: control is the provider of information to the section. Control provides the information and section acts on it.<br/>
	 * <br/>
	 * consumer: control is the consumer of information provided by the section. Section provides the information and the control acts on it.
	 * @returns The role played by the control when it is the only content in the Fiori Elements Object Page Section.
	 * @public
	 */
	getSectionContentRole(): "provider" | "consumer";
	/**
	 * When the content role is "provider" this method is called by the section to get the information from the the provider.
	 * @returns The data from the provider which is needed by the section.
	 *@public
	 */
	getDataFromProvider?(useSingleTextAreaFieldAsNotes: boolean): ProviderData;
	/**
	 * When the content role is "consumer" this method is called by the section to collect
	 * and send information from the section to the control.
	 * @param consumerData Data provide by the section to the control.
	 * @public
	 */
	sendDataToConsumer?(consumerData: ConsumerData): void;
}
