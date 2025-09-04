import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, event, property } from "sap/fe/base/ClassSupport";
import type UI5Event from "sap/ui/base/Event";
import UI5Element from "sap/ui/core/Element";
import type Context from "sap/ui/model/Context";
import type { EventHandler } from "types/extension_types";

/**
 * A callback function that is called when the value of the watched property changes.
 * @param value The new value of the watched property
 * @param oldValue The old value of the watched property
 * @param isInitial Whether the value change is the initial value
 * @param context The binding context of the watched property
 * @typedef
 * @public
 */
export type WatcherCallback = (value: unknown, oldValue: unknown, isInitial: boolean, context: Context) => void;

/**
 * The DataWatcher is an element you can use to watch a property binding and get notified when the value changes.
 *
 */
@defineUI5Class("sap.fe.core.controls.DataWatcher")
export default class DataWatcher extends UI5Element {
	@property({ type: "any" })
	propertyBinding?: unknown;

	@event()
	valueChanged?: EventHandler<UI5Event<{ value: unknown; oldValue: unknown; isInitial: boolean; context: Context }, DataWatcher>>;

	private _initialValue?: unknown;

	private isInitial: boolean;

	private _previousContextPath?: string;

	constructor(idOrProps?: string | PropertiesOf<DataWatcher>, props?: PropertiesOf<DataWatcher>) {
		super(idOrProps as string | undefined, props);
		this.isInitial = true;
	}

	setPropertyBinding(propertyBinding: string): void {
		const oldValue = this.getProperty("propertyBinding");
		if (this.isInitial || this._previousContextPath !== this.getBindingContext()?.getPath()) {
			this.isInitial = false;
			this._initialValue = propertyBinding;
			this._previousContextPath = this.getBindingContext()?.getPath();
		}
		super.setProperty("propertyBinding", propertyBinding);
		this.fireEvent("valueChanged", {
			value: propertyBinding,
			oldValue: oldValue,
			isInitial: propertyBinding === this._initialValue,
			context: this.getBindingContext()
		});
	}
}
