/**
 * Helper class that allows to create a Promise and resolve it "from the outside".
 *
 * For example, to return a string promise that is resolved when an event is fired:
 * <code>
 * 		const keeper = new PromiseKeeper<string>();
 * 		eventProvider.attachEvent('myEvent', () => {
 * 			keeper.resolve("I'm resolved!!");
 * 		});
 *
 * 		return keeper.promise;
 * </code>
 */
export default class PromiseKeeper<Type> {
	private resolver?: (result: Type) => void;

	private rejector?: (error: Error) => void;

	/**
	 * The Promise wrapped by the PromiseKeeper
	 */
	public readonly promise: Promise<Type>;

	constructor() {
		this.promise = new Promise<Type>((resolve, reject) => {
			this.resolver = resolve;
			this.rejector = reject;
		});
	}

	/**
	 * Resolves the wrapped Promise.
	 * @param result The resolved value.
	 */
	resolve(result: Type): void {
		if (this.resolver) {
			this.resolver(result);
		}
	}

	/**
	 * Rejects the wrapped Promise. The promise is always rejected using an Error object.
	 * @param error The error or error message for the rejection.
	 */
	reject(error?: string | Error): void {
		if (this.rejector) {
			if (error === undefined || typeof error === "string") {
				this.rejector(new Error(error));
			} else {
				this.rejector(error);
			}
		}
	}
}
