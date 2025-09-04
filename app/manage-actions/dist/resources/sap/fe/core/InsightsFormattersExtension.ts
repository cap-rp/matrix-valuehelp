// This import is fine as this file will only be loaded in insights context
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import CardExtension from "sap/insights/CardExtension";
import valueFormatters from "./formatters/ValueFormatter";

class InsightsFormatters extends CardExtension {
	public init(): void {
		super.init.apply(this);

		this.addFormatters("sapfe", {
			formatWithBrackets: valueFormatters.formatWithBrackets,
			formatTitle: valueFormatters.formatTitle
		});
	}
}

export default InsightsFormatters;
