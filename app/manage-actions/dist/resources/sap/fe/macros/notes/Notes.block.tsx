import Log from "sap/base/Log";
import { blockAttribute, defineBuildingBlock } from "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport";
import { xml } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import BuildingBlockTemplatingBase from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase";
import Library from "sap/ui/core/Lib";
import type Context from "sap/ui/model/Context";

@defineBuildingBlock({
	name: "Notes",
	namespace: "sap.fe.macros",
	libraries: ["sap/nw/core/gbt/notes/lib/reuse"]
})
export default class NotesBuildingBlock extends BuildingBlockTemplatingBase {
	/**
	 * The 'id' property
	 */
	@blockAttribute({ type: "string", isPublic: true, required: true })
	public id!: string;

	/**
	 * The context path provided for the field
	 */
	@blockAttribute({
		type: "sap.ui.model.Context",
		isPublic: true,
		required: true
	})
	public contextPath!: Context;

	private static async load(): Promise<typeof NotesBuildingBlock> {
		if (this.metadata.libraries) {
			// Required before usage to ensure the library is loaded and not each file individually
			try {
				await Promise.all(this.metadata.libraries.map(async (libraryName) => Library.load({ name: libraryName })));
			} catch (e) {
				const errorMessage = `Couldn't load building block ${
					this.metadata.name
				} please make sure the following libraries are available ${this.metadata.libraries.join(",")}`;
				Log.error(errorMessage);
				throw new Error(errorMessage);
			}
		}
		return Promise.resolve(this);
	}

	async getTemplate(): Promise<string> {
		// Required before usage to ensure the library is loaded and not each file individually
		try {
			await NotesBuildingBlock.load();
		} catch (e) {
			return xml`<m:Label text="${e as string}"/>`;
		}
		return xml`<fpm:CustomFragment xmlns:fpm="sap.fe.macros.fpm" id="${this.id}" contextPath="{contextPath>}" fragmentName="sap.nw.core.gbt.notes.lib.reuse.fe.fragment.NoteList"/>`;
	}
}
