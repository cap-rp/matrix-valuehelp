import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";

/**
 * Share Options.
 * @public
 */
@defineUI5Class("sap.fe.macros.share.ShareOptions")
export default class ShareOptions extends BuildingBlockObjectProperty {
	constructor(idOrProps?: string | PropertiesOf<ShareOptions>, props?: PropertiesOf<ShareOptions>) {
		let checkProps = props;
		if (typeof idOrProps !== "string") {
			checkProps = idOrProps;
		}
		const showSendEmail = checkProps?.showSendEmail;
		const showCollaborationManager = checkProps?.showCollaborationManager;
		const showMsTeamsOptions = checkProps?.showMsTeamsOptions;
		super(idOrProps as string, props); // Ignore incoming binding resolution
		this.showSendEmail = showSendEmail;
		this.showCollaborationManager = showCollaborationManager;
		this.showMsTeamsOptions = showMsTeamsOptions;
	}

	@property({ type: "boolean", isBindingInfo: true })
	showSendEmail?: boolean | CompiledBindingToolkitExpression;

	@property({ type: "boolean", isBindingInfo: true })
	showCollaborationManager?: boolean | CompiledBindingToolkitExpression;

	@property({ type: "boolean", isBindingInfo: true })
	showMsTeamsOptions?: boolean | CompiledBindingToolkitExpression;
}
