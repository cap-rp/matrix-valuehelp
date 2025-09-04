/**
 * Transforms a jQuery promise into a regular ES6/TS promise.
 * @param oThenable The jQueryPromise
 * @returns The corresponding ES6 Promise
 */
async function toES6Promise<T>(oThenable: JQuery.Promise<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		oThenable
			.then(function (...args: unknown[]) {
				resolve(Array.prototype.slice.call(args) as T);
				return;
			})
			.catch(function (...args: unknown[]) {
				reject(Array.prototype.slice.call(args));
			});
	});
}

export default toES6Promise;
