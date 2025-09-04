import Log from "sap/base/Log";
import type BaseObject from "sap/ui/base/Object";
import type Control from "sap/ui/core/Control";
import type Model from "sap/ui/model/Model";
import type JSONModel from "sap/ui/model/json/JSONModel";
export type BaseObjectWithId = BaseObject & { getId(): string; setBusy?(busy: boolean): void };
const _iTimeoutInSeconds = 30,
	_mLockCounters: Record<string, LockCountEntry> = {},
	_oReferenceDummy = {
		getId: function (): string {
			return "BusyLocker.ReferenceDummy";
		},
		setBusy: function (bBusy: boolean): void {
			Log.info(`setBusy(${bBusy}) triggered on dummy reference`);
		}
	};
function getLockCountId(oReference: BaseObjectWithId | Model, sPath?: string): string {
	return oReference.getId() + (sPath || "/busy");
}
function isLocked(oReference: BaseObjectWithId | Model, sPath?: string): boolean {
	return getLockCountId(oReference, sPath) in _mLockCounters;
}
function getLockCountEntry(oReference: BaseObjectWithId | Model, sPath?: string): LockCountEntry {
	if (!oReference || !oReference.getId) {
		Log.warning("No reference for BusyLocker, using dummy reference");
		oReference = _oReferenceDummy as unknown as BaseObjectWithId;
	}

	sPath = sPath || "/busy";
	const sId = getLockCountId(oReference, sPath);

	if (!(sId in _mLockCounters)) {
		_mLockCounters[sId] = {
			id: sId,
			path: sPath,
			reference: oReference,
			count: 0
		};
	}
	return _mLockCounters[sId];
}
/**
 * @param mLockCountEntry
 */
function deleteLockCountEntry(mLockCountEntry: LockCountEntry): void {
	delete _mLockCounters[mLockCountEntry.id];
}

type LockCountEntry = {
	id: string;
	count: number;
	path: string;
	timeout?: number;
	reference: BaseObjectWithId | Model;
};
function applyLockState(mLockCountEntry: LockCountEntry): boolean {
	const reference = mLockCountEntry.reference;
	const bBusy = mLockCountEntry.count !== 0;

	if (reference.isA && reference.isA<JSONModel>("sap.ui.model.Model")) {
		reference.setProperty(mLockCountEntry.path, bBusy, undefined, true);
	} else if ((reference as Control).setBusy) {
		(reference as Control).setBusy(bBusy);
	}

	clearTimeout(mLockCountEntry.timeout);
	if (bBusy) {
		mLockCountEntry.timeout = setTimeout(function () {
			Log.error(
				`busy lock for ${mLockCountEntry.id} with value ${mLockCountEntry.count} timed out after ${_iTimeoutInSeconds} seconds!`
			);
		}, _iTimeoutInSeconds * 1000) as unknown as number;
	} else {
		deleteLockCountEntry(mLockCountEntry);
	}

	return bBusy;
}

function changeLockCount(mLockCountEntry: LockCountEntry, iDelta: number): void {
	if (iDelta === 0) {
		mLockCountEntry.count = 0;
		Log.info(`busy lock count '${mLockCountEntry.id}' was reset to 0`);
	} else {
		mLockCountEntry.count += iDelta;
		Log.info(`busy lock count '${mLockCountEntry.id}' is ${mLockCountEntry.count}`);
	}
}

const BusyLocker = {
	lock: function (oModelOrControl: BaseObjectWithId | Model, sPath?: string): boolean {
		return this._updateLock(oModelOrControl, sPath, 1);
	},

	unlock: function (oModelOrControl: BaseObjectWithId | Model, sPath?: string): boolean {
		return this._updateLock(oModelOrControl, sPath, -1);
	},

	isLocked: function (oModelOrControl: BaseObjectWithId | Model, sPath?: string): boolean {
		return isLocked(oModelOrControl, sPath);
	},

	_updateLock: function (oReference: BaseObjectWithId | Model, sPath: string | undefined, iDelta: number): boolean {
		const mLockCountEntry = getLockCountEntry(oReference, sPath);
		changeLockCount(mLockCountEntry, iDelta);
		return applyLockState(mLockCountEntry);
	}
};

export default BusyLocker;
