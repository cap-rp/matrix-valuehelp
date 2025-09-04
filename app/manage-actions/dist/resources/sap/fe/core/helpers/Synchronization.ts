class Synchronization {
	private _fnResolve: Function | null;

	private _isResolved: boolean;

	constructor() {
		this._fnResolve = null;
		this._isResolved = false;
	}

	async waitFor(): Promise<unknown> {
		if (this._isResolved) {
			return Promise.resolve();
		} else {
			return new Promise((resolve) => {
				this._fnResolve = resolve;
			});
		}
	}

	resolve(): void {
		if (!this._isResolved) {
			this._isResolved = true;
			if (this._fnResolve) {
				this._fnResolve();
			}
		}
	}
}

export default Synchronization;
