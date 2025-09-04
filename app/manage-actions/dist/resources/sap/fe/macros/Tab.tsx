import Log from "sap/base/Log";
import { defineUI5Class, event, property, xmlEventHandler, type PropertiesOf } from "sap/fe/base/ClassSupport";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import type { $IconTabFilterSettings } from "sap/m/IconTabFilter";
import IconTabFilter from "sap/m/IconTabFilter";
import MessageStrip from "sap/m/MessageStrip";
import type UI5Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import type MacroAPI from "./MacroAPI";

export type InnerControlType = MacroAPI &
	Partial<{
		resumeBinding: Function;
		suspendBinding: Function;
		getCounts: Function;
		refreshNotApplicableFields: Function;
		invalidateContent: Function;
		getContent: Function;
	}>;

@defineUI5Class("sap.fe.macros.Tab")
export default class Tab extends IconTabFilter {
	@property({ type: "string" })
	id!: string;

	@property({ type: "string" })
	count?: string;

	@event()
	internalDataRequested!: Function;

	@event()
	customRefreshCount?: Function;

	@event()
	customResumeBinding?: Function;

	@event()
	customSuspendBinding?: Function;

	isSuspended = false;

	constructor(settings: string | ($IconTabFilterSettings & PropertiesOf<Tab>), others?: $IconTabFilterSettings & PropertiesOf<Tab>) {
		if (typeof settings === "string") {
			others ??= {};
			others.id = settings;
		}
		super(settings as unknown as string, others);
		this.setKey(generate([this.id]));
		this.insertContent(
			<MessageStrip
				text={"{tabsInternal>/" + this.id + "/notApplicable/title}"}
				type="Information"
				showIcon="true"
				showCloseButton="true"
				class="sapUiTinyMargin"
				visible={"{= (${tabsInternal>/" + this.id + "/notApplicable/fields} || []).length>0 }"}
			/>,
			0
		);
		this.getTabContent()[0]?.attachEvent("internalDataRequested", this.onInternalDataRequested.bind(this));
	}

	@xmlEventHandler()
	onInternalDataRequested(evt: UI5Event): void {
		this.fireEvent("internalDataRequested", evt.getParameters());
	}

	/**
	 * Gets tab content only of inner control type (table or chart).
	 * @returns Array of inner controls
	 */
	getTabContent(): InnerControlType[] {
		return this.getContent().filter((item) => item.isA(["sap.fe.macros.table.TableAPI", "sap.fe.macros.Chart"])) as InnerControlType[];
	}

	resumeBinding(requestIfNotInitialized: boolean): void {
		if (this.isSuspended) {
			this.getTabContent()?.forEach((content) => content.resumeBinding?.(requestIfNotInitialized));
			this.fireEvent("customResumeBinding");
			this.isSuspended = false;
		}
	}

	suspendBinding(): void {
		if (!this.isSuspended) {
			this.getTabContent()?.forEach((content) => content.suspendBinding?.());
			this.fireEvent("customSuspendBinding");
			this.isSuspended = true;
		}
	}

	invalidateContent(): void {
		this.getTabContent()?.forEach((content) => content.invalidateContent?.());
	}

	hasCounts(): boolean {
		if (this.hasListeners("customRefreshCount") || this.getTabContent()?.[0]?.getCounts) {
			return true;
		}
		return false;
	}

	/**
	 * Refreshes the tab count.
	 *
	 */
	refreshCount(): void {
		if (this.hasCounts()) {
			this.setCount("...");
			this.getTabContent()?.[0]
				?.getCounts?.()
				.then((count: string): Tab => {
					return this.setCount(count || "0");
				})
				.catch(function (error: unknown): void {
					Log.error(`Error while requesting Counts for Control: ${error}`);
				});
			this.fireEvent("customRefreshCount");
		}
	}

	refreshNotApplicableFields(filterControl: Control): string[] {
		return this.getTabContent()?.[0]?.refreshNotApplicableFields?.(filterControl);
	}
}
