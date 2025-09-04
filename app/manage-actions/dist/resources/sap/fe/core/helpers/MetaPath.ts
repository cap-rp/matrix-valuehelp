import type {
	ConvertedMetadata,
	EntitySet,
	EntityType,
	NavigationProperty,
	PathAnnotationExpression,
	ResolutionTarget,
	ServiceObject,
	ServiceObjectAndAnnotation,
	Singleton
} from "@sap-ux/vocabularies-types";
import type { AnnotationPath, Property, PropertyAnnotationValue } from "@sap-ux/vocabularies-types/Edm";
import { isAnnotationPath, isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";

function isServiceObject(objectPart: ServiceObjectAndAnnotation): objectPart is ServiceObject {
	return objectPart && objectPart.hasOwnProperty("_type");
}

function enhancePath(sBasePath: string, sPathAddition?: string): string {
	if (sPathAddition) {
		if (sPathAddition.startsWith("/")) {
			return sPathAddition;
		} else if (sPathAddition.startsWith("@")) {
			return sBasePath + sPathAddition;
		} else if (!sBasePath.endsWith("/")) {
			return sBasePath + "/" + sPathAddition;
		} else {
			return sBasePath + sPathAddition;
		}
	}
	return sBasePath;
}

type ResolvedTarget<T> = T extends AnnotationPath<infer K>
	? K
	: T extends PropertyAnnotationValue<infer V extends string>
	? V
	: T extends PathAnnotationExpression<unknown>
	? Property | undefined
	: T;

type ContextRootEntity = EntitySet | Singleton;

export default class MetaPath<T> {
	private rootEntitySet: EntitySet | Singleton;

	private contextRootEntitySet: ContextRootEntity | undefined;

	private absolutePath: string;

	private serviceObjectPath: string;

	private relativePath: string;

	private navigationProperties: NavigationProperty[];

	private contextNavigationProperties: NavigationProperty[];

	private currentEntitySet: EntitySet | Singleton | undefined;

	private currentEntityType?: EntityType;

	private targetObject: T;

	/**
	 * Create the MetaPath object.
	 * @param convertedMetadata The current model converter output
	 * @param metaPath The current object metaPath
	 * @param contextPath The current context
	 */
	constructor(
		private convertedMetadata: ConvertedMetadata,
		private metaPath: string,
		private contextPath: string
	) {
		this.navigationProperties = [];
		this.contextNavigationProperties = [];
		this.absolutePath = enhancePath(contextPath, metaPath);
		this.relativePath = this.absolutePath.replace(contextPath, "");
		if (this.relativePath.startsWith("/")) {
			this.relativePath = this.relativePath.substring(1);
		}

		const resolvedMetaPath: ResolutionTarget<T> = this.convertedMetadata.resolvePath(this.absolutePath);
		const resolvedContextPath: ResolutionTarget<T> = this.convertedMetadata.resolvePath(contextPath);
		if (resolvedMetaPath.target === undefined || resolvedMetaPath.target === null) {
			throw new Error(`No annotation target found for ${metaPath}`);
		}
		this.targetObject = resolvedMetaPath.target;
		let rootEntitySet: EntitySet | Singleton | undefined;
		let currentEntitySet: EntitySet | Singleton | undefined;
		let currentEntityType: EntityType | undefined;
		let navigatedPaths: string[] = [];
		resolvedMetaPath.objectPath.forEach((objectPart: ServiceObjectAndAnnotation) => {
			if (isServiceObject(objectPart)) {
				switch (objectPart._type) {
					case "NavigationProperty":
						navigatedPaths.push(objectPart.name);
						this.navigationProperties.push(objectPart);
						currentEntityType = objectPart.targetType;
						if (currentEntitySet && currentEntitySet.navigationPropertyBinding.hasOwnProperty(navigatedPaths.join("/"))) {
							currentEntitySet = currentEntitySet.navigationPropertyBinding[navigatedPaths.join("/")];
							navigatedPaths = [];
						}
						break;
					case "Singleton":
					case "EntitySet":
						if (rootEntitySet === undefined) {
							rootEntitySet = objectPart;
						}
						currentEntitySet = objectPart;
						currentEntityType = currentEntitySet.entityType;
						break;
					case "EntityType":
						if (currentEntityType === undefined) {
							currentEntityType = objectPart;
						}
						break;
					default:
						break;
				}
			}
		});
		resolvedContextPath.objectPath.forEach((objectPart: ServiceObjectAndAnnotation) => {
			rootEntitySet = this.getResolvedContextPath(objectPart, currentEntityType, rootEntitySet);
		});
		if (rootEntitySet === undefined || currentEntityType === undefined) {
			throw new Error("MetaPath doesn't contain an entitySet -> Should never happen");
		}
		this.serviceObjectPath = this.contextPath;
		if (this.navigationProperties.length) {
			this.serviceObjectPath += "/" + this.navigationProperties.map((nav) => nav.name).join("/");
		}
		this.rootEntitySet = rootEntitySet;
		this.currentEntitySet = currentEntitySet;
		this.currentEntityType = currentEntityType;
	}

	private getResolvedContextPath(
		objectPart: ServiceObjectAndAnnotation,
		currentEntityType: EntityType | undefined,
		rootEntitySet: EntitySet | Singleton | undefined
	): EntitySet | Singleton | undefined {
		if (isServiceObject(objectPart)) {
			switch (objectPart._type) {
				case "NavigationProperty":
					this.contextNavigationProperties.push(objectPart);
					break;
				case "EntitySet":
					if (this.contextRootEntitySet === undefined) {
						this.contextRootEntitySet = objectPart;
					}
					if (rootEntitySet === undefined && objectPart.entityType === currentEntityType) {
						rootEntitySet = objectPart;
					}
					break;
				default:
					break;
			}
		}
		return rootEntitySet;
	}

	public getContextPath(): string {
		return this.contextPath;
	}

	/**
	 * Retrieve the absolute path for this MetaPath.
	 * @param sPathPart The path to evaluate
	 * @returns The absolute path
	 */
	public getPath(sPathPart?: string): string {
		return enhancePath(this.absolutePath, sPathPart);
	}

	/**
	 * Retrieve the path relative to the context for this MetaPath.
	 * @param sPathPart The path to evaluate
	 * @returns The relative path
	 */
	public getRelativePath(sPathPart?: string): string {
		return enhancePath(this.relativePath, sPathPart);
	}

	/**
	 * Retrieve the typed target for this object call.
	 * @returns The typed target object
	 */
	public getTarget(): T {
		return this.targetObject;
	}

	/**
	 * Retrieve the closest entityset in the path.
	 * @returns The closest entityset
	 */
	public getClosestEntitySet(): EntitySet | Singleton {
		let closestEntitySet: EntitySet | Singleton = this.rootEntitySet;
		for (const navigationProperty of this.navigationProperties) {
			if (closestEntitySet.navigationPropertyBinding[navigationProperty.name]) {
				closestEntitySet = closestEntitySet.navigationPropertyBinding[navigationProperty.name];
			}
		}
		return closestEntitySet;
	}

	public getClosestEntityType(): EntityType {
		let closestEntityType: EntityType = this.rootEntitySet.entityType;
		for (const navigationProperty of this.navigationProperties) {
			closestEntityType = navigationProperty.targetType;
		}
		return closestEntityType;
	}

	/**
	 * Retrieve the closest entityset in the path.
	 * @returns The closest entityset
	 */
	public getContextClosestEntitySet(): EntitySet | Singleton | undefined {
		let closestEntitySet: EntitySet | Singleton | undefined = this.contextRootEntitySet;
		if (closestEntitySet) {
			for (const navigationProperty of this.contextNavigationProperties) {
				if (closestEntitySet.navigationPropertyBinding[navigationProperty.name]) {
					closestEntitySet = closestEntitySet.navigationPropertyBinding[navigationProperty.name];
				}
			}
		}
		return closestEntitySet;
	}

	public getNavigationProperties(): NavigationProperty[] {
		return this.navigationProperties;
	}

	public getMetaPathForPath<SubType>(targetPath: string): MetaPath<SubType> | undefined {
		try {
			return new MetaPath<SubType>(this.convertedMetadata, enhancePath(this.serviceObjectPath, targetPath), this.contextPath);
		} catch {
			return undefined;
		}
	}

	public getMetaPathForObject<SubType extends { fullyQualifiedName: string }>(
		targetObject: SubType
	): MetaPath<ResolvedTarget<SubType>> | undefined {
		if (isAnnotationPath(targetObject)) {
			return this.getMetaPathForPath<ResolvedTarget<SubType>>(targetObject.value);
		} else if (isPathAnnotationExpression(targetObject)) {
			return this.getMetaPathForPath<ResolvedTarget<SubType>>(targetObject.path);
		} else {
			let metaPathApp = targetObject?.fullyQualifiedName?.replace(
				this.rootEntitySet?.entityType.fullyQualifiedName,
				this.contextPath
			);
			if (metaPathApp === targetObject?.fullyQualifiedName) {
				metaPathApp = targetObject.fullyQualifiedName?.replace(
					(this.targetObject as { fullyQualifiedName: string })?.fullyQualifiedName,
					this.relativePath
				); // This branch is reached when the target has no relationship to the parent, in that case the fullyQualifiedName refers to the full path of the new target as something completely independent somehow, we need to make sure it's considered as a root object.
			}
			return new MetaPath<ResolvedTarget<SubType>>(this.convertedMetadata, metaPathApp, this.contextPath);
		}
	}

	public getConvertedMetadata(): ConvertedMetadata {
		return this.convertedMetadata;
	}

	public getDataModelObjectPath(): DataModelObjectPath<T> {
		return {
			targetObject: this.targetObject,
			startingEntitySet: this.rootEntitySet,
			targetEntitySet: this.getClosestEntitySet(),
			targetEntityType: this.getClosestEntityType(),
			navigationProperties: this.getNavigationProperties(),
			convertedTypes: this.convertedMetadata
		};
	}
}
