import type AppComponent from "sap/fe/core/AppComponent";
import { setCoreUIFactory, type CoreUIFactory, type StandardDialog, type StandardOperationParameterDialog } from "sap/fe/core/UIProvider";
import CreateDialog from "sap/fe/macros/coreUI/CreateDialog";
import OperationParameterDialog from "sap/fe/macros/coreUI/OperationParameterDialog";
import type Control from "sap/ui/core/Control";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";

const factory: CoreUIFactory = {
	newCreateDialog(
		contextToUpdate: ODataV4Context,
		fieldNames: string[],
		appComponent: AppComponent,
		mode: "Standalone" | "WithNavigation",
		parentControl?: Control
	): StandardDialog {
		return new CreateDialog(contextToUpdate, fieldNames, appComponent, mode, parentControl);
	},
	newOperationParameterDialog(action, parameters, parameterValues, entitySetName, messageHandler): StandardOperationParameterDialog {
		return new OperationParameterDialog(action, parameters, parameterValues, entitySetName, messageHandler);
	}
};

setCoreUIFactory(factory);
