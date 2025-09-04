import CustomData from "sap/ui/core/CustomData";

/**
 * Create a custom data object.
 * @param key
 * @param value
 * @returns The CustomData object or undefined if the value is undefined
 */
export function createCustomData(key: string, value: unknown | undefined): CustomData | undefined {
	return value !== undefined ? <CustomData key={key} value={value} /> : undefined;
}

/**
 * Create an array of custom data objects.
 * @param datas
 * @returns The array of CustomData objects
 */
export function createCustomDatas(datas: { key: string; value: unknown | undefined }[]): CustomData[] | undefined {
	const customDatas = datas.map((data) => createCustomData(data.key, data.value)).filter((data) => data !== undefined) as CustomData[];
	return customDatas.length > 0 ? customDatas : undefined;
}
