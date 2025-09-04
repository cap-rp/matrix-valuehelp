import Log from "sap/base/Log";
import { defineUI5Class, extensible, finalExtension, methodOverride, privateExtension, publicExtension } from "sap/fe/base/ClassSupport";
import type AppComponent from "sap/fe/core/AppComponent";
import type PageController from "sap/fe/core/PageController";
import DataQueryWatcher from "sap/fe/core/controllerextensions/pageReady/DataQueryWatcher";
import TemplatedViewServiceFactory from "sap/fe/core/services/TemplatedViewServiceFactory";
import type ChartBlock from "sap/fe/macros/Chart";
import type FilterBar from "sap/fe/macros/controls/FilterBar";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import type Event from "sap/ui/base/Event";
import EventProvider from "sap/ui/base/EventProvider";
import type ManagedObject from "sap/ui/base/ManagedObject";
import Component from "sap/ui/core/Component";
import type ComponentContainer from "sap/ui/core/ComponentContainer";
import type Control from "sap/ui/core/Control";
import Rendering from "sap/ui/core/Rendering";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import OverrideExecution from "sap/ui/core/mvc/OverrideExecution";
import type View from "sap/ui/core/mvc/View";
import type Binding from "sap/ui/model/Binding";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import CommonUtils from "../CommonUtils";

type RenderingEx = typeof Rendering & {
	attachUIUpdated: Function;
	detachUIUpdated: Function;
};
@defineUI5Class("sap.fe.core.controllerextensions.PageReady")
class PageReadyControllerExtension extends ControllerExtension {
	protected base!: PageController;

	private _oEventProvider!: EventProvider;

	private view!: View;

	private appComponent!: AppComponent;

	private pageComponent!: Component;

	private _oContainer!: Control;

	private _bAfterBindingAlreadyApplied!: boolean;

	private _fnContainerDelegate?: object;

	private _nbWaits!: number;

	private _bIsPageReady!: boolean;

	private _bWaitingForRefresh!: boolean;

	private bShown!: boolean;

	private bHasContext!: boolean;

	private bTablesChartsLoaded?: boolean;

	private pageReadyTimer: number | undefined;

	private queryWatcher!: DataQueryWatcher;

	private onAfterBindingPromise!: Promise<void>;

	private pageReadyTimeoutDefault = 7000;

	private pageReadyTimeoutTimer?: number;

	private pageReadyTimeout?: number;

	constructor() {
		super();
	}

	@methodOverride()
	public onInit(): void {
		this._nbWaits = 0;
		this._oEventProvider = this._oEventProvider ? this._oEventProvider : new EventProvider();
		this.view = this.getView();

		this.appComponent = CommonUtils.getAppComponent(this.view);
		this.pageComponent = Component.getOwnerComponentFor(this.view) as Component;
		const manifestContent = this.appComponent.getManifest();
		this.pageReadyTimeout = manifestContent["sap.ui5"]?.pageReadyTimeout ?? this.pageReadyTimeoutDefault;

		if (this.pageComponent?.attachContainerDefined) {
			this.pageComponent.attachContainerDefined((oEvent: Event<{ container: ComponentContainer }>) =>
				this.registerContainer(oEvent.getParameter("container"))
			);
		} else {
			this.registerContainer(this.view);
		}

		const rootControlController = this.appComponent.getRootControl().getController();
		const placeholder = rootControlController?.getPlaceholder?.();
		if (placeholder?.isPlaceholderDebugEnabled()) {
			this.attachEvent(
				"pageReady",
				null,
				() => {
					placeholder.getPlaceholderDebugStats().iPageReadyEventTimestamp = Date.now();
				},
				this
			);
			this.attachEvent(
				"heroesBatchReceived",
				null,
				() => {
					placeholder.getPlaceholderDebugStats().iHeroesBatchReceivedEventTimestamp = Date.now();
				},
				this
			);
		}

		this.queryWatcher = new DataQueryWatcher(this._oEventProvider, this.checkPageReadyDebounced.bind(this));
	}

	@methodOverride()
	public onExit(): void {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		delete this._oAppComponent;
		if (this._oContainer && this._fnContainerDelegate) {
			this._oContainer.removeEventDelegate(this._fnContainerDelegate);
		}
	}

	@publicExtension()
	@finalExtension()
	public waitFor(oPromise: Promise<unknown>): void {
		this._nbWaits++;
		oPromise
			.finally(() => {
				setTimeout(() => {
					this._nbWaits--;
				}, 0);
			})
			.catch(null);
	}

	@methodOverride("_routing")
	onRouteMatched(): void {
		this._bIsPageReady = false;
	}

	@methodOverride("_routing")
	async onRouteMatchedFinished(): Promise<void> {
		await this.onAfterBindingPromise;
		this.checkPageReadyDebounced();
	}

	public registerAggregatedControls(mainBindingContext?: Context): Promise<void>[] {
		if (mainBindingContext) {
			const mainObjectBinding = mainBindingContext.getBinding();
			this.queryWatcher.registerBinding(mainObjectBinding);
		}

		const promises: Promise<void>[] = [];
		const controls = this.getView().findAggregatedObjects(true);

		controls.forEach((element: ManagedObject & { mBindingInfos?: Record<string, { binding?: Binding }> }): void => {
			const objectBinding = element.getObjectBinding();
			if (objectBinding) {
				// Register on all object binding (mostly used on object pages)
				this.queryWatcher.registerBinding(objectBinding);
			} else {
				const aBindingKeys = Object.keys(element?.mBindingInfos ?? {});
				aBindingKeys.forEach((propertyName) => {
					const listBinding = element?.mBindingInfos?.[propertyName].binding;

					if (listBinding && listBinding.isA<ODataListBinding>("sap.ui.model.odata.v4.ODataListBinding")) {
						this.queryWatcher.registerBinding(listBinding);
					}
				});
			}
			// This is dirty but MDCTables and MDCCharts have a weird loading lifecycle
			if (element.isA<TableAPI>("sap.fe.macros.table.TableAPI") || element.isA<ChartBlock>("sap.fe.macros.Chart")) {
				const tableOrChart = (element as TableAPI).getContent?.() ?? (element as ChartBlock).getChartControl();
				this.bTablesChartsLoaded = false;
				promises.push(this.queryWatcher.registerTableOrChart(tableOrChart));
			} else if (element.isA<FilterBar>("sap.fe.macros.controls.FilterBar")) {
				this.queryWatcher.registerFilterBar(element);
			}
		});

		return promises;
	}

	@methodOverride("_routing")
	onAfterBinding(oBindingContext?: Context, parameters?: { deferredCreation?: boolean }): void {
		// In case the page is rebind we need to clear the timer (eg: in FCL, the user can select 2 items successively in the list report)
		if (this.pageReadyTimeoutTimer) {
			clearTimeout(this.pageReadyTimeoutTimer);
		}

		if (!parameters?.deferredCreation || !this.isContextExpected() || oBindingContext) {
			this.pageReadyTimeoutTimer = setTimeout(() => {
				Log.error(
					`The PageReady Event was not fired within the ${this.pageReadyTimeout} ms timeout . It has been forced. Please contact your application developer for further analysis`
				);
				this._oEventProvider.fireEvent("pageReady");
			}, this.pageReadyTimeout);
		} else {
			// We are in deferred creation with no context, we need to wait for the context to be set by the create dialog
			// We also need to disable the placeholder animation
			const rootControlController = this.appComponent.getRootControl().getController();
			const placeholder = rootControlController?.getPlaceholder?.();
			placeholder?.disableAnimation();
		}

		if (this.isContextExpected() && !oBindingContext) {
			// Force to mention we are expecting data
			this.bHasContext = false;
			return;
		} else {
			this.bHasContext = true;
		}

		if (this._bAfterBindingAlreadyApplied) {
			return;
		}

		this._bAfterBindingAlreadyApplied = true;

		this.attachEventOnce("pageReady", null, () => {
			clearTimeout(this.pageReadyTimeoutTimer);
			this.pageReadyTimeoutTimer = undefined;
			this._bAfterBindingAlreadyApplied = false;
			this.queryWatcher.reset();
		});

		this.onAfterBindingPromise = new Promise<void>(async (resolve): Promise<void> => {
			const aTableChartInitializedPromises = this.registerAggregatedControls(oBindingContext);

			if (aTableChartInitializedPromises.length > 0) {
				await Promise.all(aTableChartInitializedPromises);
				this.bTablesChartsLoaded = true;
				this.checkPageReadyDebounced();
				resolve();
			} else {
				this.checkPageReadyDebounced();
				resolve();
			}
		});
	}

	@publicExtension()
	@finalExtension()
	public isPageReady(): boolean {
		return this._bIsPageReady;
	}

	@publicExtension()
	@finalExtension()
	public async waitPageReady(): Promise<void> {
		return new Promise((resolve) => {
			if (this.isPageReady()) {
				resolve();
			} else {
				if (!this._oEventProvider) {
					this._oEventProvider = new EventProvider();
				}
				this.attachEventOnce(
					"pageReady",
					null,
					() => {
						resolve();
					},
					this
				);
			}
		});
	}

	@publicExtension()
	@finalExtension()
	public attachEventOnce(sEventId: string, oData: object | null, fnFunction?: Function, oListener?: object): EventProvider {
		// eslint-disable-next-line prefer-rest-params
		return this._oEventProvider.attachEventOnce(sEventId, oData as object, fnFunction as Function, oListener);
	}

	@publicExtension()
	@finalExtension()
	public attachEvent(sEventId: string, oData: object | null, fnFunction: Function, oListener: object): EventProvider {
		// eslint-disable-next-line prefer-rest-params
		return this._oEventProvider.attachEvent(sEventId, oData as object, fnFunction, oListener);
	}

	@publicExtension()
	@finalExtension()
	public detachEvent(sEventId: string, fnFunction: Function): EventProvider {
		// eslint-disable-next-line prefer-rest-params
		return this._oEventProvider.detachEvent(sEventId, fnFunction);
	}

	private registerContainer(oContainer: Control): void {
		this._oContainer = oContainer;
		this._fnContainerDelegate = {
			onBeforeShow: (): void => {
				this.bShown = false;
				this._bIsPageReady = false;
			},
			onBeforeHide: (): void => {
				this.bShown = false;
				this._bIsPageReady = false;
			},
			onAfterShow: (): void => {
				this.bShown = true;
				this.onAfterBindingPromise?.then((): void => {
					return this.checkPageReadyDebounced(true);
				});
			}
		};
		this._oContainer?.addEventDelegate(this._fnContainerDelegate, this);
	}

	@privateExtension()
	@extensible(OverrideExecution.Instead)
	public isContextExpected(): boolean {
		return false;
	}

	@publicExtension()
	public checkPageReadyDebounced(bFromNav = false): void {
		if (this.pageReadyTimer) {
			clearTimeout(this.pageReadyTimer);
		}
		const model = this.getView().getModel() as ODataModel;
		let timeOut: number;
		// isContextExpected = true when Object Page is displayed
		if ((model && model.getOptimisticBatchEnabler() === null) || this.isContextExpected()) {
			timeOut = 200;
		} else {
			// We are waiting less time because data is already there (optimisticBatch)
			timeOut = 20;
		}
		this.pageReadyTimer = setTimeout(() => {
			this._checkPageReady(bFromNav);
		}, timeOut) as unknown as number;
	}

	public _checkPageReady(bFromNav = false): void {
		const fnUIUpdated = (): void => {
			// Wait until the UI is no longer dirty
			if (!Rendering.isPending()) {
				(Rendering as RenderingEx).detachUIUpdated(fnUIUpdated);
				this._bWaitingForRefresh = false;
				this.checkPageReadyDebounced();
			}
		};

		// In case UIUpdate does not get called, check if UI is not dirty and then call _checkPageReady
		const checkUIUpdated = (): void => {
			if (Rendering.isPending()) {
				setTimeout(checkUIUpdated, 500);
			} else if (this._bWaitingForRefresh) {
				this._bWaitingForRefresh = false;
				(Rendering as RenderingEx).detachUIUpdated(fnUIUpdated);
				this.checkPageReadyDebounced();
			}
		};

		if (
			this.bShown &&
			this.queryWatcher.isDataReceived() !== false &&
			this.bTablesChartsLoaded !== false &&
			(!this.isContextExpected() || this.bHasContext) // Either no context is expected or there is one
		) {
			if (this.queryWatcher.isDataReceived() === true && !bFromNav && !this._bWaitingForRefresh && Rendering.isPending()) {
				// If we requested data we get notified as soon as the data arrived, so before the next rendering tick
				this.queryWatcher.resetDataReceived();
				this._bWaitingForRefresh = true;
				(Rendering as RenderingEx).attachUIUpdated(fnUIUpdated);
				setTimeout(checkUIUpdated, 500);
			} else if (
				(!this._bWaitingForRefresh && Rendering.isPending()) ||
				this._nbWaits !== 0 ||
				TemplatedViewServiceFactory.getNumberOfViewsInCreationState() > 0 ||
				this.queryWatcher.isSearchPending()
			) {
				this._bWaitingForRefresh = true;
				(Rendering as RenderingEx).attachUIUpdated(fnUIUpdated);
				setTimeout(checkUIUpdated, 500);
			} else if (!this._bWaitingForRefresh) {
				// In the case we're not waiting for any data (navigating back to a page we already have loaded)
				// just wait for a frame to fire the event.
				this._bIsPageReady = true;
				this._oEventProvider.fireEvent("pageReady");
			}
		}
	}

	/**
	 * Forces the 'pageReady' event to be sent.
	 */
	forcePageReady(): void {
		this._oEventProvider.fireEvent("pageReady");
	}
}

export default PageReadyControllerExtension;
