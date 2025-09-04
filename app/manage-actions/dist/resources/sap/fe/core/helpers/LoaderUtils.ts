import Log from "sap/base/Log";

export async function requireDependencies(dependencyNames: string[]): Promise<unknown[]> {
	let resolveFn!: Function;
	let rejectFn!: Function;
	const awaiter = new Promise((resolve, reject) => {
		resolveFn = resolve;
		rejectFn = reject;
	});
	if (dependencyNames.length > 0) {
		sap.ui.require(
			dependencyNames,
			(...dependencies: unknown[]) => {
				resolveFn(dependencies);
			},
			(err: unknown) => {
				Log.error(`Error while loading dependency modules: ${dependencyNames.join(", ")}: ${err}`);
				rejectFn(err);
			}
		);
	} else {
		resolveFn([]);
	}
	return awaiter as Promise<unknown[]>;
}
