import BaseObject from "sap/ui/base/Object";

/**
 * This is the successor of {@link sap.ui.generic.app.navigation.service.NavError}.<br> An object that provides error handling information during runtime.
 * @public
 * @param {string} errorCode The code for an internal error of a consumer that allows you to track the source locations
 * @since 1.83.0
 */
export class NavError extends BaseObject {
	private _sErrorCode: string;

	/**
	 * Constructor requiring the error code as input.
	 * @param errorCode String based error code.
	 */
	public constructor(errorCode: string) {
		super();
		this._sErrorCode = errorCode;
	}

	/**
	 * Returns the error code with which the instance has been created.
	 * @public
	 * @returns The error code of the error
	 */
	public getErrorCode(): string {
		return this._sErrorCode;
	}
}

// Exporting the class as properly typed UI5Class
const UI5Class = BaseObject.extend("sap.fe.navigation.NavError", NavError.prototype as any) as typeof NavError;
type UI5Class = InstanceType<typeof NavError>;
export default UI5Class;
