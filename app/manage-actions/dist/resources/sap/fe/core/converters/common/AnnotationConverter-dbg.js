/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2024 SAP SE. All rights reserved
 */
 sap.ui.define([], function() {
 	var AnnotationConverter;
/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 603:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.convert = void 0;
const VocabularyReferences_1 = __webpack_require__(42);
const utils_1 = __webpack_require__(854);
/**
 * Symbol to extend an annotation with the reference to its target.
 */
const ANNOTATION_TARGET = Symbol('Annotation Target');
/**
 * Append an object to the list of visited objects if it is different from the last object in the list.
 *
 * @param objectPath    The list of visited objects
 * @param visitedObject The object
 * @returns The list of visited objects
 */
function appendObjectPath(objectPath, visitedObject) {
    if (objectPath[objectPath.length - 1] !== visitedObject) {
        objectPath.push(visitedObject);
    }
    return objectPath;
}
/**
 * Resolves a (possibly relative) path.
 *
 * @param converter         Converter
 * @param startElement      The starting point in case of relative path resolution
 * @param path              The path to resolve
 * @param annotationsTerm   Only for error reporting: The annotation term
 * @returns An object containing the resolved target and the elements that were visited while getting to the target.
 */
function resolveTarget(converter, startElement, path, annotationsTerm) {
    var _a, _b, _c, _d, _e;
    if (path === undefined) {
        return { target: undefined, objectPath: [], messages: [] };
    }
    // absolute paths always start at the entity container
    if (path.startsWith('/')) {
        path = path.substring(1);
        startElement = undefined; // will resolve to the entity container (see below)
    }
    const pathSegments = path.split('/').reduce((targetPath, segment) => {
        if (segment.includes('@')) {
            // Separate out the annotation
            const [pathPart, annotationPart] = (0, utils_1.splitAtFirst)(segment, '@');
            targetPath.push(pathPart);
            targetPath.push(`@${annotationPart}`);
        }
        else {
            targetPath.push(segment);
        }
        return targetPath;
    }, []);
    // determine the starting point for the resolution
    if (startElement === undefined) {
        // no starting point given: start at the entity container
        if (pathSegments[0].startsWith(`${converter.rawSchema.namespace}.`) &&
            pathSegments[0] !== ((_a = converter.getConvertedEntityContainer()) === null || _a === void 0 ? void 0 : _a.fullyQualifiedName)) {
            // We have a fully qualified name in the path that is not the entity container.
            startElement =
                (_d = (_c = (_b = converter.getConvertedEntityType(pathSegments[0])) !== null && _b !== void 0 ? _b : converter.getConvertedComplexType(pathSegments[0])) !== null && _c !== void 0 ? _c : converter.getConvertedAction(pathSegments[0])) !== null && _d !== void 0 ? _d : converter.getConvertedAction(`${pathSegments[0]}()`); // unbound action
            pathSegments.shift(); // Let's remove the first path element
        }
        else {
            startElement = converter.getConvertedEntityContainer();
        }
    }
    else if (startElement[ANNOTATION_TARGET] !== undefined) {
        // annotation: start at the annotation target
        startElement = startElement[ANNOTATION_TARGET];
    }
    else if (startElement._type === 'Property') {
        // property: start at the entity type or complex type the property belongs to
        const parentElementFQN = (0, utils_1.substringBeforeFirst)(startElement.fullyQualifiedName, '/');
        startElement =
            (_e = converter.getConvertedEntityType(parentElementFQN)) !== null && _e !== void 0 ? _e : converter.getConvertedComplexType(parentElementFQN);
    }
    const result = pathSegments.reduce((current, segment) => {
        var _a, _b, _c, _d, _e;
        const error = (message) => {
            current.messages.push({ message });
            current.target = undefined;
            return current;
        };
        if (current.target === undefined) {
            return current;
        }
        current.objectPath = appendObjectPath(current.objectPath, current.target);
        // Annotation
        if (segment.startsWith('@') && segment !== '@$ui5.overload') {
            const [vocabularyAlias, term] = converter.splitTerm(segment);
            const annotation = (_a = current.target.annotations[vocabularyAlias.substring(1)]) === null || _a === void 0 ? void 0 : _a[term];
            if (annotation !== undefined) {
                current.target = annotation;
                return current;
            }
            return error(`Annotation '${segment.substring(1)}' not found on ${current.target._type} '${current.target.fullyQualifiedName}'`);
        }
        // $Path / $AnnotationPath syntax
        if (current.target.$target) {
            let subPath;
            if (segment === '$AnnotationPath') {
                subPath = current.target.value;
            }
            else if (segment === '$Path') {
                subPath = current.target.path;
            }
            if (subPath !== undefined) {
                const subTarget = resolveTarget(converter, current.target[ANNOTATION_TARGET], subPath);
                subTarget.objectPath.forEach((visitedSubObject) => {
                    if (!current.objectPath.includes(visitedSubObject)) {
                        current.objectPath = appendObjectPath(current.objectPath, visitedSubObject);
                    }
                });
                current.target = subTarget.target;
                current.objectPath = appendObjectPath(current.objectPath, current.target);
                return current;
            }
        }
        // traverse based on the element type
        switch ((_b = current.target) === null || _b === void 0 ? void 0 : _b._type) {
            case 'Schema':
                // next element: EntityType, ComplexType, Action, EntityContainer ?
                break;
            case 'EntityContainer':
                {
                    const thisElement = current.target;
                    if (segment === '' || converter.unalias(segment) === thisElement.fullyQualifiedName) {
                        return current;
                    }
                    // next element: EntitySet, Singleton or ActionImport?
                    const nextElement = (_d = (_c = thisElement.entitySets.by_name(segment)) !== null && _c !== void 0 ? _c : thisElement.singletons.by_name(segment)) !== null && _d !== void 0 ? _d : thisElement.actionImports.by_name(segment);
                    if (nextElement) {
                        current.target = nextElement;
                        return current;
                    }
                }
                break;
            case 'EntitySet':
            case 'Singleton': {
                const thisElement = current.target;
                if (segment === '' || segment === '$Type') {
                    // Empty Path after an EntitySet or Singleton means EntityType
                    current.target = thisElement.entityType;
                    return current;
                }
                if (segment === '$') {
                    return current;
                }
                if (segment === '$NavigationPropertyBinding') {
                    const navigationPropertyBindings = thisElement.navigationPropertyBinding;
                    current.target = navigationPropertyBindings;
                    return current;
                }
                // continue resolving at the EntitySet's or Singleton's type
                const result = resolveTarget(converter, thisElement.entityType, segment);
                current.target = result.target;
                current.objectPath = result.objectPath.reduce(appendObjectPath, current.objectPath);
                return current;
            }
            case 'EntityType':
                {
                    const thisElement = current.target;
                    if (segment === '' || segment === '$Type') {
                        return current;
                    }
                    const property = thisElement.entityProperties.by_name(segment);
                    if (property) {
                        current.target = property;
                        return current;
                    }
                    const navigationProperty = thisElement.navigationProperties.by_name(segment);
                    if (navigationProperty) {
                        current.target = navigationProperty;
                        return current;
                    }
                    const actionName = (0, utils_1.substringBeforeFirst)(converter.unalias(segment), '(');
                    const action = thisElement.actions[actionName];
                    if (action) {
                        current.target = action;
                        return current;
                    }
                }
                break;
            case 'ActionImport': {
                // continue resolving at the Action
                const result = resolveTarget(converter, current.target.action, segment);
                current.target = result.target;
                current.objectPath = result.objectPath.reduce(appendObjectPath, current.objectPath);
                return current;
            }
            case 'Action': {
                const thisElement = current.target;
                if (segment === '') {
                    return current;
                }
                if (segment === '@$ui5.overload' || segment === '0') {
                    return current;
                }
                if (segment === '$Parameter' && thisElement.isBound) {
                    current.target = thisElement.parameters;
                    return current;
                }
                const nextElement = (_e = thisElement.parameters[segment]) !== null && _e !== void 0 ? _e : thisElement.parameters.find((param) => param.name === segment);
                if (nextElement) {
                    current.target = nextElement;
                    return current;
                }
                break;
            }
            case 'Property':
                {
                    const thisElement = current.target;
                    // Property or NavigationProperty of the ComplexType
                    const type = thisElement.targetType;
                    if (type !== undefined) {
                        const property = type.properties.by_name(segment);
                        if (property) {
                            current.target = property;
                            return current;
                        }
                        const navigationProperty = type.navigationProperties.by_name(segment);
                        if (navigationProperty) {
                            current.target = navigationProperty;
                            return current;
                        }
                    }
                }
                break;
            case 'ActionParameter':
                const referencedType = current.target.typeReference;
                if (referencedType !== undefined) {
                    const result = resolveTarget(converter, referencedType, segment);
                    current.target = result.target;
                    current.objectPath = result.objectPath.reduce(appendObjectPath, current.objectPath);
                    return current;
                }
                break;
            case 'NavigationProperty':
                // continue at the NavigationProperty's target type
                const result = resolveTarget(converter, current.target.targetType, segment);
                current.target = result.target;
                current.objectPath = result.objectPath.reduce(appendObjectPath, current.objectPath);
                return current;
            default:
                if (segment === '') {
                    return current;
                }
                if (current.target[segment]) {
                    current.target = current.target[segment];
                    current.objectPath = appendObjectPath(current.objectPath, current.target);
                    return current;
                }
        }
        return error(`Element '${segment}' not found at ${current.target._type} '${current.target.fullyQualifiedName}'`);
    }, { target: startElement, objectPath: [], messages: [] });
    // Diagnostics
    result.messages.forEach((message) => converter.logError(message.message));
    if (!result.target) {
        if (annotationsTerm) {
            const annotationType = inferTypeFromTerm(converter, annotationsTerm, startElement.fullyQualifiedName);
            converter.logError('Unable to resolve the path expression: ' +
                '\n' +
                path +
                '\n' +
                '\n' +
                'Hint: Check and correct the path values under the following structure in the metadata (annotation.xml file or CDS annotations for the application): \n\n' +
                '<Annotation Term = ' +
                annotationsTerm +
                '>' +
                '\n' +
                '<Record Type = ' +
                annotationType +
                '>' +
                '\n' +
                '<AnnotationPath = ' +
                path +
                '>');
        }
        else {
            converter.logError('Unable to resolve the path expression: ' +
                path +
                '\n' +
                '\n' +
                'Hint: Check and correct the path values under the following structure in the metadata (annotation.xml file or CDS annotations for the application): \n\n' +
                '<Annotation Term = ' +
                pathSegments[0] +
                '>' +
                '\n' +
                '<PropertyValue  Path= ' +
                pathSegments[1] +
                '>');
        }
    }
    return result;
}
/**
 * Typeguard to check if the path contains an annotation.
 *
 * @param pathStr the path to evaluate
 * @returns true if there is an annotation in the path.
 */
function isAnnotationPath(pathStr) {
    return pathStr.includes('@');
}
function mapPropertyPath(converter, propertyPath, fullyQualifiedName, currentTarget, currentTerm) {
    const result = {
        type: 'PropertyPath',
        value: propertyPath.PropertyPath,
        fullyQualifiedName: fullyQualifiedName,
        [ANNOTATION_TARGET]: currentTarget
    };
    (0, utils_1.lazy)(result, '$target', () => resolveTarget(converter, currentTarget, propertyPath.PropertyPath, currentTerm).target);
    return result;
}
function mapAnnotationPath(converter, annotationPath, fullyQualifiedName, currentTarget, currentTerm) {
    const result = {
        type: 'AnnotationPath',
        value: converter.unalias(annotationPath.AnnotationPath),
        fullyQualifiedName: fullyQualifiedName,
        [ANNOTATION_TARGET]: currentTarget
    };
    (0, utils_1.lazy)(result, '$target', () => resolveTarget(converter, currentTarget, result.value, currentTerm).target);
    return result;
}
function mapNavigationPropertyPath(converter, navigationPropertyPath, fullyQualifiedName, currentTarget, currentTerm) {
    var _a;
    const result = {
        type: 'NavigationPropertyPath',
        value: (_a = navigationPropertyPath.NavigationPropertyPath) !== null && _a !== void 0 ? _a : '',
        fullyQualifiedName: fullyQualifiedName,
        [ANNOTATION_TARGET]: currentTarget
    };
    (0, utils_1.lazy)(result, '$target', () => resolveTarget(converter, currentTarget, navigationPropertyPath.NavigationPropertyPath, currentTerm).target);
    return result;
}
function mapPath(converter, path, fullyQualifiedName, currentTarget, currentTerm) {
    const result = {
        type: 'Path',
        path: path.Path,
        fullyQualifiedName: fullyQualifiedName,
        getValue() {
            return undefined; // TODO: Required according to the type...
        },
        [ANNOTATION_TARGET]: currentTarget
    };
    (0, utils_1.lazy)(result, '$target', () => resolveTarget(converter, currentTarget, path.Path, currentTerm).target);
    return result;
}
function parseValue(converter, currentTarget, currentTerm, currentProperty, currentSource, propertyValue, valueFQN) {
    if (propertyValue === undefined) {
        return undefined;
    }
    switch (propertyValue.type) {
        case 'String':
            return propertyValue.String;
        case 'Int':
            return propertyValue.Int;
        case 'Bool':
            return propertyValue.Bool;
        case 'Decimal':
            return (0, utils_1.Decimal)(propertyValue.Decimal);
        case 'Date':
            return propertyValue.Date;
        case 'EnumMember':
            const splitEnum = propertyValue.EnumMember.split(' ').map((enumValue) => {
                var _a;
                const unaliased = (_a = converter.unalias(enumValue)) !== null && _a !== void 0 ? _a : '';
                return (0, utils_1.alias)(VocabularyReferences_1.VocabularyReferences, unaliased);
            });
            if (splitEnum[0] !== undefined && utils_1.EnumIsFlag[(0, utils_1.substringBeforeFirst)(splitEnum[0], '/')]) {
                return splitEnum;
            }
            return splitEnum[0];
        case 'PropertyPath':
            return mapPropertyPath(converter, propertyValue, valueFQN, currentTarget, currentTerm);
        case 'NavigationPropertyPath':
            return mapNavigationPropertyPath(converter, propertyValue, valueFQN, currentTarget, currentTerm);
        case 'AnnotationPath':
            return mapAnnotationPath(converter, propertyValue, valueFQN, currentTarget, currentTerm);
        case 'Path': {
            if (isAnnotationPath(propertyValue.Path)) {
                // inline the target
                return resolveTarget(converter, currentTarget, propertyValue.Path, currentTerm).target;
            }
            else {
                return mapPath(converter, propertyValue, valueFQN, currentTarget, currentTerm);
            }
        }
        case 'Record':
            return parseRecord(converter, currentTerm, currentTarget, currentProperty, currentSource, propertyValue.Record, valueFQN);
        case 'Collection':
            return parseCollection(converter, currentTarget, currentTerm, currentProperty, currentSource, propertyValue.Collection, valueFQN);
        case 'Apply':
        case 'Null':
        case 'Not':
        case 'Eq':
        case 'Ne':
        case 'Gt':
        case 'Ge':
        case 'Lt':
        case 'Le':
        case 'If':
        case 'And':
        case 'Or':
        default:
            return propertyValue;
    }
}
/**
 * Infer the type of a term based on its type.
 *
 * @param converter         Converter
 * @param annotationsTerm   The annotation term
 * @param annotationTarget  The annotation target
 * @param currentProperty   The current property of the record
 * @returns The inferred type.
 */
function inferTypeFromTerm(converter, annotationsTerm, annotationTarget, currentProperty) {
    let targetType = utils_1.TermToTypes[annotationsTerm];
    if (currentProperty) {
        annotationsTerm = `${(0, utils_1.substringBeforeLast)(annotationsTerm, '.')}.${currentProperty}`;
        targetType = utils_1.TermToTypes[annotationsTerm];
    }
    converter.logError(`The type of the record used within the term ${annotationsTerm} was not defined and was inferred as ${targetType}.
Hint: If possible, try to maintain the Type property for each Record.
<Annotations Target="${annotationTarget}">
	<Annotation Term="${annotationsTerm}">
		<Record>...</Record>
	</Annotation>
</Annotations>`);
    return targetType;
}
function isDataFieldWithForAction(annotationContent) {
    return (annotationContent.hasOwnProperty('Action') &&
        (annotationContent.$Type === 'com.sap.vocabularies.UI.v1.DataFieldForAction' ||
            annotationContent.$Type === 'com.sap.vocabularies.UI.v1.DataFieldWithAction'));
}
function parseRecordType(converter, currentTerm, currentTarget, currentProperty, recordDefinition) {
    let targetType;
    if (!recordDefinition.type && currentTerm) {
        targetType = inferTypeFromTerm(converter, currentTerm, currentTarget.fullyQualifiedName, currentProperty);
    }
    else {
        targetType = converter.unalias(recordDefinition.type);
    }
    return targetType;
}
function parseRecord(converter, currentTerm, currentTarget, currentProperty, currentSource, annotationRecord, currentFQN) {
    const record = {
        $Type: parseRecordType(converter, currentTerm, currentTarget, currentProperty, annotationRecord),
        fullyQualifiedName: currentFQN,
        [ANNOTATION_TARGET]: currentTarget,
        __source: currentSource
    };
    for (const propertyValue of annotationRecord.propertyValues) {
        (0, utils_1.lazy)(record, propertyValue.name, () => parseValue(converter, currentTarget, currentTerm, propertyValue.name, currentSource, propertyValue.value, `${currentFQN}/${propertyValue.name}`));
    }
    // annotations on the record
    (0, utils_1.lazy)(record, 'annotations', resolveAnnotationsOnAnnotation(converter, annotationRecord, record));
    if (isDataFieldWithForAction(record)) {
        (0, utils_1.lazy)(record, 'ActionTarget', () => {
            var _a, _b;
            const actionName = converter.unalias((_a = record.Action) === null || _a === void 0 ? void 0 : _a.toString());
            // (1) Bound action of the annotation target?
            let actionTarget = currentTarget.actions[actionName];
            if (!actionTarget) {
                // (2) ActionImport (= unbound action)?
                actionTarget = (_b = converter.getConvertedActionImport(actionName)) === null || _b === void 0 ? void 0 : _b.action;
            }
            if (!actionTarget) {
                // (3) Bound action of a different EntityType (the actionName is fully qualified in this case)
                actionTarget = converter.getConvertedAction(actionName);
                if (!(actionTarget === null || actionTarget === void 0 ? void 0 : actionTarget.isBound)) {
                    actionTarget = undefined;
                }
            }
            if (!actionTarget) {
                converter.logError(`${record.fullyQualifiedName}: Unable to resolve '${record.Action}' ('${actionName}')`);
            }
            return actionTarget;
        });
    }
    return record;
}
/**
 * Retrieve or infer the collection type based on its content.
 *
 * @param collectionDefinition
 * @returns the type of the collection
 */
function getOrInferCollectionType(collectionDefinition) {
    let type = collectionDefinition.type;
    if (type === undefined && collectionDefinition.length > 0) {
        const firstColItem = collectionDefinition[0];
        if (firstColItem.hasOwnProperty('PropertyPath')) {
            type = 'PropertyPath';
        }
        else if (firstColItem.hasOwnProperty('Path')) {
            type = 'Path';
        }
        else if (firstColItem.hasOwnProperty('AnnotationPath')) {
            type = 'AnnotationPath';
        }
        else if (firstColItem.hasOwnProperty('NavigationPropertyPath')) {
            type = 'NavigationPropertyPath';
        }
        else if (typeof firstColItem === 'object' &&
            (firstColItem.hasOwnProperty('type') || firstColItem.hasOwnProperty('propertyValues'))) {
            type = 'Record';
        }
        else if (typeof firstColItem === 'string') {
            type = 'String';
        }
    }
    else if (type === undefined) {
        type = 'EmptyCollection';
    }
    return type;
}
function parseCollection(converter, currentTarget, currentTerm, currentProperty, currentSource, collectionDefinition, parentFQN) {
    const collectionDefinitionType = getOrInferCollectionType(collectionDefinition);
    switch (collectionDefinitionType) {
        case 'PropertyPath':
            return collectionDefinition.map((path, index) => mapPropertyPath(converter, path, `${parentFQN}/${index}`, currentTarget, currentTerm));
        case 'Path':
            // TODO: make lazy?
            return collectionDefinition.map((pathValue) => {
                return resolveTarget(converter, currentTarget, pathValue.Path, currentTerm).target;
            });
        case 'AnnotationPath':
            return collectionDefinition.map((path, index) => mapAnnotationPath(converter, path, `${parentFQN}/${index}`, currentTarget, currentTerm));
        case 'NavigationPropertyPath':
            return collectionDefinition.map((path, index) => mapNavigationPropertyPath(converter, path, `${parentFQN}/${index}`, currentTarget, currentTerm));
        case 'Record':
            return collectionDefinition.map((recordDefinition, recordIdx) => {
                return parseRecord(converter, currentTerm, currentTarget, currentProperty, currentSource, recordDefinition, `${parentFQN}/${recordIdx}`);
            });
        case 'Apply':
        case 'Null':
        case 'If':
        case 'Eq':
        case 'Ne':
        case 'Lt':
        case 'Gt':
        case 'Le':
        case 'Ge':
        case 'Not':
        case 'And':
        case 'Or':
            return collectionDefinition.map((ifValue) => ifValue);
        case 'String':
            return collectionDefinition.map((stringValue) => {
                if (typeof stringValue === 'string' || stringValue === undefined) {
                    return stringValue;
                }
                else {
                    return stringValue.String;
                }
            });
        default:
            if (collectionDefinition.length === 0) {
                return [];
            }
            throw new Error('Unsupported case');
    }
}
function isV4NavigationProperty(navProp) {
    return !!navProp.targetTypeName;
}
function convertAnnotation(converter, target, rawAnnotation) {
    var _a;
    let annotation;
    if (rawAnnotation.record) {
        annotation = parseRecord(converter, rawAnnotation.term, target, '', rawAnnotation.__source, rawAnnotation.record, rawAnnotation.fullyQualifiedName);
    }
    else if (rawAnnotation.collection === undefined) {
        annotation = parseValue(converter, target, rawAnnotation.term, '', rawAnnotation.__source, (_a = rawAnnotation.value) !== null && _a !== void 0 ? _a : { type: 'Bool', Bool: true }, rawAnnotation.fullyQualifiedName);
    }
    else if (rawAnnotation.collection) {
        annotation = parseCollection(converter, target, rawAnnotation.term, '', rawAnnotation.__source, rawAnnotation.collection, rawAnnotation.fullyQualifiedName);
    }
    else {
        throw new Error('Unsupported case');
    }
    switch (typeof annotation) {
        case 'string':
            // eslint-disable-next-line no-new-wrappers
            annotation = new String(annotation);
            break;
        case 'boolean':
            // eslint-disable-next-line no-new-wrappers
            annotation = new Boolean(annotation);
            break;
        case 'number':
            annotation = new Number(annotation);
            break;
        default:
            // do nothing
            break;
    }
    annotation.fullyQualifiedName = rawAnnotation.fullyQualifiedName;
    annotation[ANNOTATION_TARGET] = target;
    const [vocAlias, vocTerm] = converter.splitTerm(rawAnnotation.term);
    annotation.term = converter.unalias(`${vocAlias}.${vocTerm}`, VocabularyReferences_1.VocabularyReferences);
    annotation.qualifier = rawAnnotation.qualifier;
    annotation.__source = rawAnnotation.__source;
    try {
        (0, utils_1.lazy)(annotation, 'annotations', resolveAnnotationsOnAnnotation(converter, rawAnnotation, annotation));
    }
    catch (e) {
        // not an error: parseRecord() already adds annotations, but the other parseXXX functions don't, so this can happen
    }
    return annotation;
}
class Converter {
    /**
     * Get preprocessed annotations on the specified target.
     *
     * @param target    The annotation target
     * @returns An array of annotations
     */
    getAnnotations(target) {
        var _a;
        if (this.annotationsByTarget === undefined) {
            const annotationSources = Object.keys(this.rawSchema.annotations).map((source) => ({
                name: source,
                annotationList: this.rawSchema.annotations[source]
            }));
            this.annotationsByTarget = (0, utils_1.mergeAnnotations)(this.rawMetadata.references, ...annotationSources);
        }
        return (_a = this.annotationsByTarget[target]) !== null && _a !== void 0 ? _a : [];
    }
    getConvertedEntityContainer() {
        return this.getConvertedElement(this.rawMetadata.schema.entityContainer.fullyQualifiedName, this.rawMetadata.schema.entityContainer, convertEntityContainer);
    }
    getConvertedEntitySet(fullyQualifiedName) {
        return this.convertedOutput.entitySets.by_fullyQualifiedName(fullyQualifiedName);
    }
    getConvertedSingleton(fullyQualifiedName) {
        return this.convertedOutput.singletons.by_fullyQualifiedName(fullyQualifiedName);
    }
    getConvertedEntityType(fullyQualifiedName) {
        return this.convertedOutput.entityTypes.by_fullyQualifiedName(fullyQualifiedName);
    }
    getConvertedComplexType(fullyQualifiedName) {
        return this.convertedOutput.complexTypes.by_fullyQualifiedName(fullyQualifiedName);
    }
    getConvertedTypeDefinition(fullyQualifiedName) {
        return this.convertedOutput.typeDefinitions.by_fullyQualifiedName(fullyQualifiedName);
    }
    getConvertedActionImport(fullyQualifiedName) {
        let actionImport = this.convertedOutput.actionImports.by_fullyQualifiedName(fullyQualifiedName);
        if (!actionImport) {
            actionImport = this.convertedOutput.actionImports.by_name(fullyQualifiedName);
        }
        return actionImport;
    }
    getConvertedAction(fullyQualifiedName) {
        return this.convertedOutput.actions.by_fullyQualifiedName(fullyQualifiedName);
    }
    convert(rawValue, map) {
        if (Array.isArray(rawValue)) {
            return () => {
                const converted = rawValue.reduce((convertedElements, rawElement) => {
                    const convertedElement = this.getConvertedElement(rawElement.fullyQualifiedName, rawElement, map);
                    if (convertedElement) {
                        convertedElements.push(convertedElement);
                    }
                    return convertedElements;
                }, []);
                (0, utils_1.addGetByValue)(converted, 'name');
                (0, utils_1.addGetByValue)(converted, 'fullyQualifiedName');
                return converted;
            };
        }
        else {
            return () => this.getConvertedElement(rawValue.fullyQualifiedName, rawValue, map);
        }
    }
    constructor(rawMetadata, convertedOutput) {
        this.convertedElements = new Map();
        this.rawMetadata = rawMetadata;
        this.rawSchema = rawMetadata.schema;
        this.convertedOutput = convertedOutput;
    }
    getConvertedElement(fullyQualifiedName, rawElement, map) {
        let converted = this.convertedElements.get(fullyQualifiedName);
        if (converted === undefined) {
            const rawMetadata = typeof rawElement === 'function' ? rawElement.apply(undefined, [fullyQualifiedName]) : rawElement;
            if (rawMetadata !== undefined) {
                converted = map.apply(undefined, [this, rawMetadata]);
                this.convertedElements.set(fullyQualifiedName, converted);
            }
        }
        return converted;
    }
    logError(message) {
        this.convertedOutput.diagnostics.push({ message });
    }
    /**
     * Split the alias from the term value.
     *
     * @param term the value of the term
     * @returns the term alias and the actual term value
     */
    splitTerm(term) {
        const aliased = (0, utils_1.alias)(VocabularyReferences_1.VocabularyReferences, term);
        return (0, utils_1.splitAtLast)(aliased, '.');
    }
    unalias(value, references = this.rawMetadata.references) {
        var _a;
        return (_a = (0, utils_1.unalias)(references, value, this.rawSchema.namespace)) !== null && _a !== void 0 ? _a : '';
    }
}
function resolveEntityType(converter, fullyQualifiedName) {
    return () => {
        let entityType = converter.getConvertedEntityType(fullyQualifiedName);
        if (!entityType) {
            converter.logError(`EntityType '${fullyQualifiedName}' not found`);
            entityType = {};
        }
        return entityType;
    };
}
function resolveNavigationPropertyBindings(converter, rawNavigationPropertyBindings) {
    return () => Object.keys(rawNavigationPropertyBindings).reduce((navigationPropertyBindings, bindingPath) => {
        const rawBindingTarget = rawNavigationPropertyBindings[bindingPath];
        (0, utils_1.lazy)(navigationPropertyBindings, bindingPath, () => {
            var _a;
            // the NavigationPropertyBinding will lead to either an EntitySet or a Singleton, it cannot be undefined
            return (((_a = converter.getConvertedEntitySet(rawBindingTarget)) !== null && _a !== void 0 ? _a : converter.getConvertedSingleton(rawBindingTarget)));
        });
        return navigationPropertyBindings;
    }, {});
}
function resolveAnnotations(converter, rawAnnotationTarget) {
    const nestedAnnotations = rawAnnotationTarget.annotations;
    return () => createAnnotationsObject(converter, rawAnnotationTarget, nestedAnnotations !== null && nestedAnnotations !== void 0 ? nestedAnnotations : converter.getAnnotations(rawAnnotationTarget.fullyQualifiedName));
}
function resolveAnnotationsOnAnnotation(converter, annotationRecord, annotationTerm) {
    return () => {
        const currentFQN = annotationTerm.fullyQualifiedName;
        // be graceful when resolving annotations on annotations: Sometimes they are referenced directly, sometimes they
        // are part of the global annotations list
        let annotations;
        if (annotationRecord.annotations && annotationRecord.annotations.length > 0) {
            annotations = annotationRecord.annotations;
        }
        else {
            annotations = converter.getAnnotations(currentFQN);
        }
        annotations === null || annotations === void 0 ? void 0 : annotations.forEach((annotation) => {
            annotation.target = currentFQN;
            annotation.__source = annotationTerm.__source;
            annotation[ANNOTATION_TARGET] = annotationTerm[ANNOTATION_TARGET];
            annotation.fullyQualifiedName = `${currentFQN}@${annotation.term}`;
        });
        return createAnnotationsObject(converter, annotationTerm, annotations !== null && annotations !== void 0 ? annotations : []);
    };
}
function createAnnotationsObject(converter, target, rawAnnotations) {
    return rawAnnotations.reduce((vocabularyAliases, annotation) => {
        const [vocAlias, vocTerm] = converter.splitTerm(annotation.term);
        const vocTermWithQualifier = `${vocTerm}${annotation.qualifier ? '#' + annotation.qualifier : ''}`;
        if (vocabularyAliases[vocAlias] === undefined) {
            vocabularyAliases[vocAlias] = {};
        }
        if (!vocabularyAliases[vocAlias].hasOwnProperty(vocTermWithQualifier)) {
            (0, utils_1.lazy)(vocabularyAliases[vocAlias], vocTermWithQualifier, () => converter.getConvertedElement(annotation.fullyQualifiedName, annotation, (converter, rawAnnotation) => convertAnnotation(converter, target, rawAnnotation)));
        }
        return vocabularyAliases;
    }, {});
}
/**
 * Converts an EntityContainer.
 *
 * @param converter     Converter
 * @param rawEntityContainer    Unconverted EntityContainer
 * @returns The converted EntityContainer
 */
function convertEntityContainer(converter, rawEntityContainer) {
    const convertedEntityContainer = rawEntityContainer;
    (0, utils_1.lazy)(convertedEntityContainer, 'annotations', resolveAnnotations(converter, rawEntityContainer));
    (0, utils_1.lazy)(convertedEntityContainer, 'entitySets', converter.convert(converter.rawSchema.entitySets, convertEntitySet));
    (0, utils_1.lazy)(convertedEntityContainer, 'singletons', converter.convert(converter.rawSchema.singletons, convertSingleton));
    (0, utils_1.lazy)(convertedEntityContainer, 'actionImports', converter.convert(converter.rawSchema.actionImports, convertActionImport));
    return convertedEntityContainer;
}
/**
 * Converts a Singleton.
 *
 * @param converter   Converter
 * @param rawSingleton  Unconverted Singleton
 * @returns The converted Singleton
 */
function convertSingleton(converter, rawSingleton) {
    const convertedSingleton = rawSingleton;
    (0, utils_1.lazy)(convertedSingleton, 'entityType', resolveEntityType(converter, rawSingleton.entityTypeName));
    (0, utils_1.lazy)(convertedSingleton, 'annotations', resolveAnnotations(converter, convertedSingleton));
    const _rawNavigationPropertyBindings = rawSingleton.navigationPropertyBinding;
    (0, utils_1.lazy)(convertedSingleton, 'navigationPropertyBinding', resolveNavigationPropertyBindings(converter, _rawNavigationPropertyBindings));
    return convertedSingleton;
}
/**
 * Converts an EntitySet.
 *
 * @param converter   Converter
 * @param rawEntitySet  Unconverted EntitySet
 * @returns The converted EntitySet
 */
function convertEntitySet(converter, rawEntitySet) {
    const convertedEntitySet = rawEntitySet;
    (0, utils_1.lazy)(convertedEntitySet, 'entityType', resolveEntityType(converter, rawEntitySet.entityTypeName));
    (0, utils_1.lazy)(convertedEntitySet, 'annotations', resolveAnnotations(converter, convertedEntitySet));
    const _rawNavigationPropertyBindings = rawEntitySet.navigationPropertyBinding;
    (0, utils_1.lazy)(convertedEntitySet, 'navigationPropertyBinding', resolveNavigationPropertyBindings(converter, _rawNavigationPropertyBindings));
    return convertedEntitySet;
}
/**
 * Converts an EntityType.
 *
 * @param converter   Converter
 * @param rawEntityType  Unconverted EntityType
 * @returns The converted EntityType
 */
function convertEntityType(converter, rawEntityType) {
    const convertedEntityType = rawEntityType;
    rawEntityType.keys.forEach((keyProp) => {
        keyProp.isKey = true;
    });
    (0, utils_1.lazy)(convertedEntityType, 'annotations', resolveAnnotations(converter, rawEntityType));
    (0, utils_1.lazy)(convertedEntityType, 'keys', converter.convert(rawEntityType.keys, convertProperty));
    (0, utils_1.lazy)(convertedEntityType, 'entityProperties', converter.convert(rawEntityType.entityProperties, convertProperty));
    (0, utils_1.lazy)(convertedEntityType, 'navigationProperties', converter.convert(rawEntityType.navigationProperties, convertNavigationProperty));
    (0, utils_1.lazy)(convertedEntityType, 'actions', () => converter.rawSchema.actions
        .filter((rawAction) => rawAction.isBound &&
        (rawAction.sourceType === rawEntityType.fullyQualifiedName ||
            rawAction.sourceType === `Collection(${rawEntityType.fullyQualifiedName})`))
        .reduce((actions, rawAction) => {
        const name = `${converter.rawSchema.namespace}.${rawAction.name}`;
        actions[name] = converter.getConvertedAction(rawAction.fullyQualifiedName);
        return actions;
    }, {}));
    convertedEntityType.resolvePath = (relativePath, includeVisitedObjects) => {
        const resolved = resolveTarget(converter, rawEntityType, relativePath);
        if (includeVisitedObjects) {
            return { target: resolved.target, visitedObjects: resolved.objectPath, messages: resolved.messages };
        }
        else {
            return resolved.target;
        }
    };
    return convertedEntityType;
}
/**
 * Converts a Property.
 *
 * @param converter   Converter
 * @param rawProperty  Unconverted Property
 * @returns The converted Property
 */
function convertProperty(converter, rawProperty) {
    const convertedProperty = rawProperty;
    (0, utils_1.lazy)(convertedProperty, 'annotations', resolveAnnotations(converter, rawProperty));
    (0, utils_1.lazy)(convertedProperty, 'targetType', () => {
        var _a;
        const type = rawProperty.type;
        const typeName = type.startsWith('Collection') ? type.substring(11, type.length - 1) : type;
        return (_a = converter.getConvertedComplexType(typeName)) !== null && _a !== void 0 ? _a : converter.getConvertedTypeDefinition(typeName);
    });
    return convertedProperty;
}
/**
 * Converts a NavigationProperty.
 *
 * @param converter   Converter
 * @param rawNavigationProperty  Unconverted NavigationProperty
 * @returns The converted NavigationProperty
 */
function convertNavigationProperty(converter, rawNavigationProperty) {
    var _a, _b, _c;
    const convertedNavigationProperty = rawNavigationProperty;
    convertedNavigationProperty.referentialConstraint = (_a = convertedNavigationProperty.referentialConstraint) !== null && _a !== void 0 ? _a : [];
    if (!isV4NavigationProperty(rawNavigationProperty)) {
        const associationEnd = (_b = converter.rawSchema.associations
            .find((association) => association.fullyQualifiedName === rawNavigationProperty.relationship)) === null || _b === void 0 ? void 0 : _b.associationEnd.find((end) => end.role === rawNavigationProperty.toRole);
        convertedNavigationProperty.isCollection = (associationEnd === null || associationEnd === void 0 ? void 0 : associationEnd.multiplicity) === '*';
        convertedNavigationProperty.targetTypeName = (_c = associationEnd === null || associationEnd === void 0 ? void 0 : associationEnd.type) !== null && _c !== void 0 ? _c : '';
    }
    (0, utils_1.lazy)(convertedNavigationProperty, 'targetType', resolveEntityType(converter, rawNavigationProperty.targetTypeName));
    (0, utils_1.lazy)(convertedNavigationProperty, 'annotations', resolveAnnotations(converter, rawNavigationProperty));
    return convertedNavigationProperty;
}
/**
 * Converts an ActionImport.
 *
 * @param converter   Converter
 * @param rawActionImport  Unconverted ActionImport
 * @returns The converted ActionImport
 */
function convertActionImport(converter, rawActionImport) {
    const convertedActionImport = rawActionImport;
    (0, utils_1.lazy)(convertedActionImport, 'annotations', resolveAnnotations(converter, rawActionImport));
    (0, utils_1.lazy)(convertedActionImport, 'action', () => {
        const rawActions = converter.rawSchema.actions.filter((rawAction) => !rawAction.isBound && rawAction.fullyQualifiedName.startsWith(rawActionImport.actionName));
        // this always resolves to a unique unbound action, but resolution of unbound functions can be ambiguous:
        // unbound function FQNs have overloads depending on all of their parameters
        if (rawActions.length > 1) {
            converter.logError(`Ambiguous reference in action import: ${rawActionImport.fullyQualifiedName}`);
        }
        // return the first matching action or function
        return converter.getConvertedAction(rawActions[0].fullyQualifiedName);
    });
    return convertedActionImport;
}
/**
 * Converts an Action.
 *
 * @param converter   Converter
 * @param rawAction  Unconverted Action
 * @returns The converted Action
 */
function convertAction(converter, rawAction) {
    const convertedAction = rawAction;
    if (convertedAction.sourceType) {
        (0, utils_1.lazy)(convertedAction, 'sourceEntityType', resolveEntityType(converter, rawAction.sourceType));
    }
    if (convertedAction.returnType) {
        (0, utils_1.lazy)(convertedAction, 'returnEntityType', resolveEntityType(converter, rawAction.returnType));
    }
    (0, utils_1.lazy)(convertedAction, 'parameters', converter.convert(rawAction.parameters, convertActionParameter));
    (0, utils_1.lazy)(convertedAction, 'annotations', () => {
        /*
            Annotation resolution rule for actions:

            (1) annotation target: the specific unbound or bound overload, e.g.
                    - for actions:   "x.y.z.unboundAction()" / "x.y.z.boundAction(x.y.z.Entity)"
                    - for functions: "x.y.z.unboundFunction(Edm.String)" / "x.y.z.unboundFunction(x.y.z.Entity,Edm.String)"
            (2) annotation target: unspecified overload, e.g.
                - for actions:   "x.y.z.unboundAction" / "x.y.z.boundAction"
                - for functions: "x.y.z.unboundFunction" / "x.y.z.unboundFunction"

            When resolving (1) takes precedence over (2). That is, annotations on the specific overload overwrite
            annotations on the unspecific overload, on term/qualifier level.
        */
        const unspecificOverloadTarget = (0, utils_1.substringBeforeFirst)(rawAction.fullyQualifiedName, '(');
        const specificOverloadTarget = rawAction.fullyQualifiedName;
        const effectiveAnnotations = converter.getAnnotations(specificOverloadTarget);
        const unspecificAnnotations = converter.getAnnotations(unspecificOverloadTarget);
        for (const unspecificAnnotation of unspecificAnnotations) {
            if (!effectiveAnnotations.some((annotation) => annotation.term === unspecificAnnotation.term &&
                annotation.qualifier === unspecificAnnotation.qualifier)) {
                effectiveAnnotations.push(unspecificAnnotation);
            }
        }
        return createAnnotationsObject(converter, rawAction, effectiveAnnotations);
    });
    return convertedAction;
}
/**
 * Converts an ActionParameter.
 *
 * @param converter   Converter
 * @param rawActionParameter  Unconverted ActionParameter
 * @returns The converted ActionParameter
 */
function convertActionParameter(converter, rawActionParameter) {
    const convertedActionParameter = rawActionParameter;
    (0, utils_1.lazy)(convertedActionParameter, 'typeReference', () => {
        var _a, _b;
        return (_b = (_a = converter.getConvertedEntityType(rawActionParameter.type)) !== null && _a !== void 0 ? _a : converter.getConvertedComplexType(rawActionParameter.type)) !== null && _b !== void 0 ? _b : converter.getConvertedTypeDefinition(rawActionParameter.type);
    });
    (0, utils_1.lazy)(convertedActionParameter, 'annotations', () => {
        // annotations on action parameters are resolved following the rules for actions
        const unspecificOverloadTarget = rawActionParameter.fullyQualifiedName.substring(0, rawActionParameter.fullyQualifiedName.indexOf('(')) +
            rawActionParameter.fullyQualifiedName.substring(rawActionParameter.fullyQualifiedName.indexOf(')') + 1);
        const specificOverloadTarget = rawActionParameter.fullyQualifiedName;
        const effectiveAnnotations = converter.getAnnotations(specificOverloadTarget);
        const unspecificAnnotations = converter.getAnnotations(unspecificOverloadTarget);
        for (const unspecificAnnotation of unspecificAnnotations) {
            if (!effectiveAnnotations.some((annotation) => annotation.term === unspecificAnnotation.term &&
                annotation.qualifier === unspecificAnnotation.qualifier)) {
                effectiveAnnotations.push(unspecificAnnotation);
            }
        }
        return createAnnotationsObject(converter, rawActionParameter, effectiveAnnotations);
    });
    return convertedActionParameter;
}
/**
 * Converts a ComplexType.
 *
 * @param converter   Converter
 * @param rawComplexType  Unconverted ComplexType
 * @returns The converted ComplexType
 */
function convertComplexType(converter, rawComplexType) {
    const convertedComplexType = rawComplexType;
    (0, utils_1.lazy)(convertedComplexType, 'properties', converter.convert(rawComplexType.properties, convertProperty));
    (0, utils_1.lazy)(convertedComplexType, 'navigationProperties', converter.convert(rawComplexType.navigationProperties, convertNavigationProperty));
    (0, utils_1.lazy)(convertedComplexType, 'annotations', resolveAnnotations(converter, rawComplexType));
    return convertedComplexType;
}
/**
 * Converts a TypeDefinition.
 *
 * @param converter   Converter
 * @param rawTypeDefinition  Unconverted TypeDefinition
 * @returns The converted TypeDefinition
 */
function convertTypeDefinition(converter, rawTypeDefinition) {
    const convertedTypeDefinition = rawTypeDefinition;
    (0, utils_1.lazy)(convertedTypeDefinition, 'annotations', resolveAnnotations(converter, rawTypeDefinition));
    return convertedTypeDefinition;
}
/**
 * Convert a RawMetadata into an object representation to be used to easily navigate a metadata object and its annotation.
 *
 * @param rawMetadata
 * @returns the converted representation of the metadata.
 */
function convert(rawMetadata) {
    // Converter Output
    const convertedOutput = {
        version: rawMetadata.version,
        namespace: rawMetadata.schema.namespace,
        annotations: rawMetadata.schema.annotations,
        references: VocabularyReferences_1.VocabularyReferences,
        diagnostics: []
    };
    // Converter
    const converter = new Converter(rawMetadata, convertedOutput);
    (0, utils_1.lazy)(convertedOutput, 'entityContainer', converter.convert(converter.rawSchema.entityContainer, convertEntityContainer));
    (0, utils_1.lazy)(convertedOutput, 'entitySets', converter.convert(converter.rawSchema.entitySets, convertEntitySet));
    (0, utils_1.lazy)(convertedOutput, 'singletons', converter.convert(converter.rawSchema.singletons, convertSingleton));
    (0, utils_1.lazy)(convertedOutput, 'entityTypes', converter.convert(converter.rawSchema.entityTypes, convertEntityType));
    (0, utils_1.lazy)(convertedOutput, 'actions', converter.convert(converter.rawSchema.actions, convertAction));
    (0, utils_1.lazy)(convertedOutput, 'complexTypes', converter.convert(converter.rawSchema.complexTypes, convertComplexType));
    (0, utils_1.lazy)(convertedOutput, 'actionImports', converter.convert(converter.rawSchema.actionImports, convertActionImport));
    (0, utils_1.lazy)(convertedOutput, 'typeDefinitions', converter.convert(converter.rawSchema.typeDefinitions, convertTypeDefinition));
    convertedOutput.resolvePath = function resolvePath(path) {
        const targetResolution = resolveTarget(converter, undefined, path);
        if (targetResolution.target) {
            appendObjectPath(targetResolution.objectPath, targetResolution.target);
        }
        return targetResolution;
    };
    return convertedOutput;
}
exports.convert = convert;


/***/ }),

/***/ 131:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(603), exports);
__exportStar(__webpack_require__(854), exports);
__exportStar(__webpack_require__(815), exports);


/***/ }),

/***/ 854:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.mergeAnnotations = exports.addGetByValue = exports.createIndexedFind = exports.lazy = exports.Decimal = exports.isComplexTypeDefinition = exports.unalias = exports.alias = exports.substringBeforeLast = exports.substringBeforeFirst = exports.splitAtLast = exports.splitAtFirst = exports.defaultReferences = exports.TermToTypes = exports.EnumIsFlag = void 0;
var EnumIsFlag_1 = __webpack_require__(255);
Object.defineProperty(exports, "EnumIsFlag", ({ enumerable: true, get: function () { return EnumIsFlag_1.EnumIsFlag; } }));
var TermToTypes_1 = __webpack_require__(66);
Object.defineProperty(exports, "TermToTypes", ({ enumerable: true, get: function () { return TermToTypes_1.TermToTypes; } }));
var VocabularyReferences_1 = __webpack_require__(42);
Object.defineProperty(exports, "defaultReferences", ({ enumerable: true, get: function () { return VocabularyReferences_1.VocabularyReferences; } }));
function splitAt(string, index) {
    return index < 0 ? [string, ''] : [string.substring(0, index), string.substring(index + 1)];
}
function substringAt(string, index) {
    return index < 0 ? string : string.substring(0, index);
}
/**
 * Splits a string at the first occurrence of a separator.
 *
 * @param string    The string to split
 * @param separator Separator, e.g. a single character.
 * @returns An array consisting of two elements: the part before the first occurrence of the separator and the part after it. If the string does not contain the separator, the second element is the empty string.
 */
function splitAtFirst(string, separator) {
    return splitAt(string, string.indexOf(separator));
}
exports.splitAtFirst = splitAtFirst;
/**
 * Splits a string at the last occurrence of a separator.
 *
 * @param string    The string to split
 * @param separator Separator, e.g. a single character.
 * @returns An array consisting of two elements: the part before the last occurrence of the separator and the part after it. If the string does not contain the separator, the second element is the empty string.
 */
function splitAtLast(string, separator) {
    return splitAt(string, string.lastIndexOf(separator));
}
exports.splitAtLast = splitAtLast;
/**
 * Returns the substring before the first occurrence of a separator.
 *
 * @param string    The string
 * @param separator Separator, e.g. a single character.
 * @returns The substring before the first occurrence of the separator, or the input string if it does not contain the separator.
 */
function substringBeforeFirst(string, separator) {
    return substringAt(string, string.indexOf(separator));
}
exports.substringBeforeFirst = substringBeforeFirst;
/**
 * Returns the substring before the last occurrence of a separator.
 *
 * @param string    The string
 * @param separator Separator, e.g. a single character.
 * @returns The substring before the last occurrence of the separator, or the input string if it does not contain the separator.
 */
function substringBeforeLast(string, separator) {
    return substringAt(string, string.lastIndexOf(separator));
}
exports.substringBeforeLast = substringBeforeLast;
/**
 * Transform an unaliased string representation annotation to the aliased version.
 *
 * @param references currentReferences for the project
 * @param unaliasedValue the unaliased value
 * @returns the aliased string representing the same
 */
function alias(references, unaliasedValue) {
    if (!references.reverseReferenceMap) {
        references.reverseReferenceMap = references.reduce((map, ref) => {
            map[ref.namespace] = ref;
            return map;
        }, {});
    }
    if (!unaliasedValue) {
        return unaliasedValue;
    }
    const [namespace, value] = splitAtLast(unaliasedValue, '.');
    const reference = references.reverseReferenceMap[namespace];
    if (reference) {
        return `${reference.alias}.${value}`;
    }
    else if (unaliasedValue.includes('@')) {
        // Try to see if it's an annotation Path like to_SalesOrder/@UI.LineItem
        const [preAlias, postAlias] = splitAtFirst(unaliasedValue, '@');
        return `${preAlias}@${alias(references, postAlias)}`;
    }
    else {
        return unaliasedValue;
    }
}
exports.alias = alias;
/**
 * Transform an aliased string to its unaliased version given a set of references.
 *
 * @param references The references to use for unaliasing.
 * @param aliasedValue The aliased value
 * @param namespace The fallback namespace
 * @returns The equal unaliased string.
 */
function unalias(references, aliasedValue, namespace) {
    var _a;
    const _unalias = (value) => {
        if (!references.referenceMap) {
            references.referenceMap = Object.fromEntries(references.map((ref) => [ref.alias, ref]));
        }
        // Aliases are of type 'SimpleIdentifier' and must not contain dots
        const [maybeAlias, rest] = splitAtFirst(value, '.');
        if (!rest || rest.includes('.')) {
            // either there is no dot in the value or there is more than one --> nothing to do
            return value;
        }
        const isAnnotation = maybeAlias.startsWith('@');
        const valueToUnalias = isAnnotation ? maybeAlias.substring(1) : maybeAlias;
        const knownReference = references.referenceMap[valueToUnalias];
        if (knownReference) {
            return isAnnotation ? `@${knownReference.namespace}.${rest}` : `${knownReference.namespace}.${rest}`;
        }
        // The alias could not be resolved using the references. Assume it is the "global" alias (= namespace)
        return namespace && !isAnnotation ? `${namespace}.${rest}` : value;
    };
    return (_a = aliasedValue === null || aliasedValue === void 0 ? void 0 : aliasedValue.split('/').reduce((segments, segment) => {
        // the segment could be an action, like "doSomething(foo.bar)"
        const [first, rest] = splitAtFirst(segment, '(');
        const subSegment = [_unalias(first)];
        if (rest) {
            const parameter = rest.slice(0, -1); // remove trailing ")"
            subSegment.push(`(${_unalias(parameter)})`);
        }
        segments.push(subSegment.join(''));
        return segments;
    }, [])) === null || _a === void 0 ? void 0 : _a.join('/');
}
exports.unalias = unalias;
/**
 * Differentiate between a ComplexType and a TypeDefinition.
 *
 * @param complexTypeDefinition
 * @returns true if the value is a complex type
 */
function isComplexTypeDefinition(complexTypeDefinition) {
    return (!!complexTypeDefinition && complexTypeDefinition._type === 'ComplexType' && !!complexTypeDefinition.properties);
}
exports.isComplexTypeDefinition = isComplexTypeDefinition;
function Decimal(value) {
    return {
        isDecimal() {
            return true;
        },
        valueOf() {
            return value;
        },
        toString() {
            return value.toString();
        }
    };
}
exports.Decimal = Decimal;
/**
 * Defines a lazy property.
 *
 * The property is initialized by calling the init function on the first read access, or by directly assigning a value.
 *
 * @param object    The host object
 * @param property  The lazy property to add
 * @param init      The function that initializes the property's value
 */
function lazy(object, property, init) {
    const initial = Symbol('initial');
    let _value = initial;
    Object.defineProperty(object, property, {
        enumerable: true,
        get() {
            if (_value === initial) {
                _value = init();
            }
            return _value;
        },
        set(value) {
            _value = value;
        }
    });
}
exports.lazy = lazy;
/**
 * Creates a function that allows to find an array element by property value.
 *
 * @param array     The array
 * @param property  Elements in the array are searched by this property
 * @returns A function that can be used to find an element of the array by property value.
 */
function createIndexedFind(array, property) {
    const index = new Map();
    return function find(value) {
        const element = index.get(value);
        if ((element === null || element === void 0 ? void 0 : element[property]) === value) {
            return element;
        }
        return array.find((element) => {
            if (!(element === null || element === void 0 ? void 0 : element.hasOwnProperty(property))) {
                return false;
            }
            const propertyValue = element[property];
            index.set(propertyValue, element);
            return propertyValue === value;
        });
    };
}
exports.createIndexedFind = createIndexedFind;
/**
 * Adds a 'get by value' function to an array.
 *
 * If this function is called with addIndex(myArray, 'name'), a new function 'by_name(value)' will be added that allows to
 * find a member of the array by the value of its 'name' property.
 *
 * @param array      The array
 * @param property   The property that will be used by the 'by_{property}()' function
 * @returns The array with the added function
 */
function addGetByValue(array, property) {
    const indexName = `by_${property}`;
    if (!array.hasOwnProperty(indexName)) {
        Object.defineProperty(array, indexName, { writable: false, value: createIndexedFind(array, property) });
    }
    else {
        throw new Error(`Property '${indexName}' already exists`);
    }
    return array;
}
exports.addGetByValue = addGetByValue;
/**
 * Merge annotations from different sources together by overwriting at the term level.
 *
 * @param references        References, used to resolve aliased annotation targets and aliased annotation terms.
 * @param annotationSources Annotation sources
 * @returns the resulting merged annotations
 */
function mergeAnnotations(references, ...annotationSources) {
    return annotationSources.reduceRight((result, { name, annotationList }) => {
        var _a;
        for (const { target, annotations } of annotationList) {
            const annotationTarget = (_a = unalias(references, target)) !== null && _a !== void 0 ? _a : target;
            if (!result[annotationTarget]) {
                result[annotationTarget] = [];
            }
            const annotationsOnTarget = annotations
                .map((rawAnnotation) => {
                var _a;
                rawAnnotation.term = (_a = unalias(references, rawAnnotation.term)) !== null && _a !== void 0 ? _a : rawAnnotation.term;
                rawAnnotation.fullyQualifiedName = rawAnnotation.qualifier
                    ? `${annotationTarget}@${rawAnnotation.term}#${rawAnnotation.qualifier}`
                    : `${annotationTarget}@${rawAnnotation.term}`;
                rawAnnotation.__source = name;
                return rawAnnotation;
            })
                .filter((annotation) => !result[annotationTarget].some((existingAnnotation) => existingAnnotation.term === annotation.term &&
                existingAnnotation.qualifier === annotation.qualifier));
            result[annotationTarget].push(...annotationsOnTarget);
        }
        return result;
    }, {});
}
exports.mergeAnnotations = mergeAnnotations;


/***/ }),

/***/ 815:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.revertTermToGenericType = void 0;
const utils_1 = __webpack_require__(854);
/**
 * Revert an object to its raw type equivalent.
 *
 * @param references the current reference
 * @param value the value to revert
 * @returns the raw value
 */
function revertObjectToRawType(references, value) {
    var _a, _b, _c, _d, _e, _f;
    let result;
    if (Array.isArray(value)) {
        result = {
            type: 'Collection',
            Collection: value.map((anno) => revertCollectionItemToRawType(references, anno))
        };
    }
    else if ((_a = value.isDecimal) === null || _a === void 0 ? void 0 : _a.call(value)) {
        result = {
            type: 'Decimal',
            Decimal: value.valueOf()
        };
    }
    else if ((_b = value.isString) === null || _b === void 0 ? void 0 : _b.call(value)) {
        const valueMatches = value.valueOf().split('.');
        if (valueMatches.length > 1 && references.find((ref) => ref.alias === valueMatches[0])) {
            result = {
                type: 'EnumMember',
                EnumMember: value.valueOf()
            };
        }
        else {
            result = {
                type: 'String',
                String: value.valueOf()
            };
        }
    }
    else if ((_c = value.isInt) === null || _c === void 0 ? void 0 : _c.call(value)) {
        result = {
            type: 'Int',
            Int: value.valueOf()
        };
    }
    else if ((_d = value.isFloat) === null || _d === void 0 ? void 0 : _d.call(value)) {
        result = {
            type: 'Float',
            Float: value.valueOf()
        };
    }
    else if ((_e = value.isDate) === null || _e === void 0 ? void 0 : _e.call(value)) {
        result = {
            type: 'Date',
            Date: value.valueOf()
        };
    }
    else if ((_f = value.isBoolean) === null || _f === void 0 ? void 0 : _f.call(value)) {
        result = {
            type: 'Bool',
            Bool: value.valueOf()
        };
    }
    else if (value.type === 'Path') {
        result = {
            type: 'Path',
            Path: value.path
        };
    }
    else if (value.type === 'AnnotationPath') {
        result = {
            type: 'AnnotationPath',
            AnnotationPath: value.value
        };
    }
    else if (value.type === 'Apply') {
        result = {
            type: 'Apply',
            $Apply: value.$Apply,
            $Function: value.$Function
        };
    }
    else if (value.type === 'Null') {
        result = {
            type: 'Null'
        };
    }
    else if (value.type === 'PropertyPath') {
        result = {
            type: 'PropertyPath',
            PropertyPath: value.value
        };
    }
    else if (value.type === 'NavigationPropertyPath') {
        result = {
            type: 'NavigationPropertyPath',
            NavigationPropertyPath: value.value
        };
    }
    else if (Object.prototype.hasOwnProperty.call(value, '$Type')) {
        result = {
            type: 'Record',
            Record: revertCollectionItemToRawType(references, value)
        };
    }
    return result;
}
/**
 * Revert a value to its raw value depending on its type.
 *
 * @param references the current set of reference
 * @param value the value to revert
 * @returns the raw expression
 */
function revertValueToRawType(references, value) {
    let result;
    const valueConstructor = value === null || value === void 0 ? void 0 : value.constructor.name;
    switch (valueConstructor) {
        case 'String':
        case 'string':
            const valueMatches = value.toString().split('.');
            if (valueMatches.length > 1 && references.find((ref) => ref.alias === valueMatches[0])) {
                result = {
                    type: 'EnumMember',
                    EnumMember: value.toString()
                };
            }
            else {
                result = {
                    type: 'String',
                    String: value.toString()
                };
            }
            break;
        case 'Boolean':
        case 'boolean':
            result = {
                type: 'Bool',
                Bool: value.valueOf()
            };
            break;
        case 'Number':
        case 'number':
            if (value.toString() === value.toFixed()) {
                result = {
                    type: 'Int',
                    Int: value.valueOf()
                };
            }
            else {
                result = {
                    type: 'Decimal',
                    Decimal: value.valueOf()
                };
            }
            break;
        case 'object':
        default:
            result = revertObjectToRawType(references, value);
            break;
    }
    return result;
}
const restrictedKeys = ['$Type', 'term', '__source', 'qualifier', 'ActionTarget', 'fullyQualifiedName', 'annotations'];
/**
 * Revert the current embedded annotations to their raw type.
 *
 * @param references the current set of reference
 * @param currentAnnotations the collection item to evaluate
 * @param targetAnnotations the place where we need to add the annotation
 */
function revertAnnotationsToRawType(references, currentAnnotations, targetAnnotations) {
    Object.keys(currentAnnotations)
        .filter((key) => key !== '_annotations')
        .forEach((key) => {
        Object.keys(currentAnnotations[key]).forEach((term) => {
            const parsedAnnotation = revertTermToGenericType(references, currentAnnotations[key][term]);
            if (!parsedAnnotation.term) {
                const unaliasedTerm = (0, utils_1.unalias)(references, `${key}.${term}`);
                if (unaliasedTerm) {
                    const qualifiedSplit = unaliasedTerm.split('#');
                    parsedAnnotation.term = qualifiedSplit[0];
                    if (qualifiedSplit.length > 1) {
                        // Sub Annotation with a qualifier, not sure when that can happen in real scenarios
                        parsedAnnotation.qualifier = qualifiedSplit[1];
                    }
                }
            }
            targetAnnotations.push(parsedAnnotation);
        });
    });
}
/**
 * Revert the current collection item to the corresponding raw annotation.
 *
 * @param references the current set of reference
 * @param collectionItem the collection item to evaluate
 * @returns the raw type equivalent
 */
function revertCollectionItemToRawType(references, collectionItem) {
    if (typeof collectionItem === 'string') {
        return collectionItem;
    }
    else if (typeof collectionItem === 'object') {
        if (collectionItem.hasOwnProperty('$Type')) {
            // Annotation Record
            const outItem = {
                type: collectionItem.$Type,
                propertyValues: []
            };
            // Could validate keys and type based on $Type
            Object.keys(collectionItem).forEach((collectionKey) => {
                if (restrictedKeys.indexOf(collectionKey) === -1) {
                    const value = collectionItem[collectionKey];
                    outItem.propertyValues.push({
                        name: collectionKey,
                        value: revertValueToRawType(references, value)
                    });
                }
                else if (collectionKey === 'annotations' && Object.keys(collectionItem[collectionKey]).length > 0) {
                    outItem.annotations = [];
                    revertAnnotationsToRawType(references, collectionItem[collectionKey], outItem.annotations);
                }
            });
            return outItem;
        }
        else if (collectionItem.type === 'PropertyPath') {
            return {
                type: 'PropertyPath',
                PropertyPath: collectionItem.value
            };
        }
        else if (collectionItem.type === 'AnnotationPath') {
            return {
                type: 'AnnotationPath',
                AnnotationPath: collectionItem.value
            };
        }
        else if (collectionItem.type === 'NavigationPropertyPath') {
            return {
                type: 'NavigationPropertyPath',
                NavigationPropertyPath: collectionItem.value
            };
        }
    }
    return undefined;
}
/**
 * Revert an annotation term to it's generic or raw equivalent.
 *
 * @param references the reference of the current context
 * @param annotation the annotation term to revert
 * @returns the raw annotation
 */
function revertTermToGenericType(references, annotation) {
    const baseAnnotation = {
        term: annotation.term,
        qualifier: annotation.qualifier
    };
    if (Array.isArray(annotation)) {
        // Collection
        if (annotation.hasOwnProperty('annotations') && Object.keys(annotation.annotations).length > 0) {
            // Annotation on a collection itself, not sure when that happens if at all
            baseAnnotation.annotations = [];
            revertAnnotationsToRawType(references, annotation.annotations, baseAnnotation.annotations);
        }
        return {
            ...baseAnnotation,
            collection: annotation.map((anno) => revertCollectionItemToRawType(references, anno))
        };
    }
    else if (annotation.hasOwnProperty('$Type')) {
        return { ...baseAnnotation, record: revertCollectionItemToRawType(references, annotation) };
    }
    else {
        return { ...baseAnnotation, value: revertValueToRawType(references, annotation) };
    }
}
exports.revertTermToGenericType = revertTermToGenericType;


/***/ }),

/***/ 255:
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EnumIsFlag = void 0;
exports.EnumIsFlag = {
    "Authorization.KeyLocation": false,
    "Core.RevisionKind": false,
    "Core.DataModificationOperationKind": false,
    "Core.Permission": true,
    "Capabilities.ConformanceLevelType": false,
    "Capabilities.IsolationLevel": true,
    "Capabilities.NavigationType": false,
    "Capabilities.SearchExpressions": true,
    "Capabilities.HttpMethod": true,
    "Aggregation.RollupType": false,
    "Common.TextFormatType": false,
    "Common.FilterExpressionType": false,
    "Common.FieldControlType": false,
    "Common.EffectType": true,
    "Communication.KindType": false,
    "Communication.ContactInformationType": true,
    "Communication.PhoneType": true,
    "Communication.GenderType": false,
    "UI.VisualizationType": false,
    "UI.CriticalityType": false,
    "UI.ImprovementDirectionType": false,
    "UI.TrendType": false,
    "UI.ChartType": false,
    "UI.ChartAxisScaleBehaviorType": false,
    "UI.ChartAxisAutoScaleDataScopeType": false,
    "UI.ChartDimensionRoleType": false,
    "UI.ChartMeasureRoleType": false,
    "UI.SelectionRangeSignType": false,
    "UI.SelectionRangeOptionType": false,
    "UI.TextArrangementType": false,
    "UI.ImportanceType": false,
    "UI.CriticalityRepresentationType": false,
    "UI.OperationGroupingType": false,
};


/***/ }),

/***/ 66:
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TermToTypes = void 0;
var TermToTypes;
(function (TermToTypes) {
    TermToTypes["Org.OData.Authorization.V1.SecuritySchemes"] = "Org.OData.Authorization.V1.SecurityScheme";
    TermToTypes["Org.OData.Authorization.V1.Authorizations"] = "Org.OData.Authorization.V1.Authorization";
    TermToTypes["Org.OData.Core.V1.Revisions"] = "Org.OData.Core.V1.RevisionType";
    TermToTypes["Org.OData.Core.V1.Links"] = "Org.OData.Core.V1.Link";
    TermToTypes["Org.OData.Core.V1.Example"] = "Org.OData.Core.V1.ExampleValue";
    TermToTypes["Org.OData.Core.V1.Messages"] = "Org.OData.Core.V1.MessageType";
    TermToTypes["Org.OData.Core.V1.ValueException"] = "Org.OData.Core.V1.ValueExceptionType";
    TermToTypes["Org.OData.Core.V1.ResourceException"] = "Org.OData.Core.V1.ResourceExceptionType";
    TermToTypes["Org.OData.Core.V1.DataModificationException"] = "Org.OData.Core.V1.DataModificationExceptionType";
    TermToTypes["Org.OData.Core.V1.IsLanguageDependent"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Core.V1.AppliesViaContainer"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Core.V1.DereferenceableIDs"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Core.V1.ConventionalIDs"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Core.V1.Permissions"] = "Org.OData.Core.V1.Permission";
    TermToTypes["Org.OData.Core.V1.DefaultNamespace"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Core.V1.Immutable"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Core.V1.Computed"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Core.V1.ComputedDefaultValue"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Core.V1.IsURL"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Core.V1.IsMediaType"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Core.V1.ContentDisposition"] = "Org.OData.Core.V1.ContentDispositionType";
    TermToTypes["Org.OData.Core.V1.OptimisticConcurrency"] = "Edm.PropertyPath";
    TermToTypes["Org.OData.Core.V1.AdditionalProperties"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Core.V1.AutoExpand"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Core.V1.AutoExpandReferences"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Core.V1.MayImplement"] = "Org.OData.Core.V1.QualifiedTypeName";
    TermToTypes["Org.OData.Core.V1.Ordered"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Core.V1.PositionalInsert"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Core.V1.AlternateKeys"] = "Org.OData.Core.V1.AlternateKey";
    TermToTypes["Org.OData.Core.V1.OptionalParameter"] = "Org.OData.Core.V1.OptionalParameterType";
    TermToTypes["Org.OData.Core.V1.OperationAvailable"] = "Edm.Boolean";
    TermToTypes["Org.OData.Core.V1.RequiresExplicitBinding"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Core.V1.ExplicitOperationBindings"] = "Org.OData.Core.V1.QualifiedBoundOperationName";
    TermToTypes["Org.OData.Core.V1.SymbolicName"] = "Org.OData.Core.V1.SimpleIdentifier";
    TermToTypes["Org.OData.Core.V1.GeometryFeature"] = "Org.OData.Core.V1.GeometryFeatureType";
    TermToTypes["Org.OData.Core.V1.AnyStructure"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Core.V1.IsDelta"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Capabilities.V1.ConformanceLevel"] = "Org.OData.Capabilities.V1.ConformanceLevelType";
    TermToTypes["Org.OData.Capabilities.V1.AsynchronousRequestsSupported"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Capabilities.V1.BatchContinueOnErrorSupported"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Capabilities.V1.IsolationSupported"] = "Org.OData.Capabilities.V1.IsolationLevel";
    TermToTypes["Org.OData.Capabilities.V1.CrossJoinSupported"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Capabilities.V1.CallbackSupported"] = "Org.OData.Capabilities.V1.CallbackType";
    TermToTypes["Org.OData.Capabilities.V1.ChangeTracking"] = "Org.OData.Capabilities.V1.ChangeTrackingType";
    TermToTypes["Org.OData.Capabilities.V1.CountRestrictions"] = "Org.OData.Capabilities.V1.CountRestrictionsType";
    TermToTypes["Org.OData.Capabilities.V1.NavigationRestrictions"] = "Org.OData.Capabilities.V1.NavigationRestrictionsType";
    TermToTypes["Org.OData.Capabilities.V1.IndexableByKey"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Capabilities.V1.TopSupported"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Capabilities.V1.SkipSupported"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Capabilities.V1.ComputeSupported"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Capabilities.V1.SelectSupport"] = "Org.OData.Capabilities.V1.SelectSupportType";
    TermToTypes["Org.OData.Capabilities.V1.BatchSupported"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Capabilities.V1.BatchSupport"] = "Org.OData.Capabilities.V1.BatchSupportType";
    TermToTypes["Org.OData.Capabilities.V1.FilterRestrictions"] = "Org.OData.Capabilities.V1.FilterRestrictionsType";
    TermToTypes["Org.OData.Capabilities.V1.SortRestrictions"] = "Org.OData.Capabilities.V1.SortRestrictionsType";
    TermToTypes["Org.OData.Capabilities.V1.ExpandRestrictions"] = "Org.OData.Capabilities.V1.ExpandRestrictionsType";
    TermToTypes["Org.OData.Capabilities.V1.SearchRestrictions"] = "Org.OData.Capabilities.V1.SearchRestrictionsType";
    TermToTypes["Org.OData.Capabilities.V1.KeyAsSegmentSupported"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Capabilities.V1.QuerySegmentSupported"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Capabilities.V1.InsertRestrictions"] = "Org.OData.Capabilities.V1.InsertRestrictionsType";
    TermToTypes["Org.OData.Capabilities.V1.DeepInsertSupport"] = "Org.OData.Capabilities.V1.DeepInsertSupportType";
    TermToTypes["Org.OData.Capabilities.V1.UpdateRestrictions"] = "Org.OData.Capabilities.V1.UpdateRestrictionsType";
    TermToTypes["Org.OData.Capabilities.V1.DeepUpdateSupport"] = "Org.OData.Capabilities.V1.DeepUpdateSupportType";
    TermToTypes["Org.OData.Capabilities.V1.DeleteRestrictions"] = "Org.OData.Capabilities.V1.DeleteRestrictionsType";
    TermToTypes["Org.OData.Capabilities.V1.CollectionPropertyRestrictions"] = "Org.OData.Capabilities.V1.CollectionPropertyRestrictionsType";
    TermToTypes["Org.OData.Capabilities.V1.OperationRestrictions"] = "Org.OData.Capabilities.V1.OperationRestrictionsType";
    TermToTypes["Org.OData.Capabilities.V1.AnnotationValuesInQuerySupported"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Capabilities.V1.ModificationQueryOptions"] = "Org.OData.Capabilities.V1.ModificationQueryOptionsType";
    TermToTypes["Org.OData.Capabilities.V1.ReadRestrictions"] = "Org.OData.Capabilities.V1.ReadRestrictionsType";
    TermToTypes["Org.OData.Capabilities.V1.CustomHeaders"] = "Org.OData.Capabilities.V1.CustomParameter";
    TermToTypes["Org.OData.Capabilities.V1.CustomQueryOptions"] = "Org.OData.Capabilities.V1.CustomParameter";
    TermToTypes["Org.OData.Capabilities.V1.MediaLocationUpdateSupported"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Capabilities.V1.DefaultCapabilities"] = "Org.OData.Capabilities.V1.DefaultCapabilitiesType";
    TermToTypes["Org.OData.Aggregation.V1.ApplySupported"] = "Org.OData.Aggregation.V1.ApplySupportedType";
    TermToTypes["Org.OData.Aggregation.V1.ApplySupportedDefaults"] = "Org.OData.Aggregation.V1.ApplySupportedBase";
    TermToTypes["Org.OData.Aggregation.V1.Groupable"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Aggregation.V1.Aggregatable"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Aggregation.V1.ContextDefiningProperties"] = "Edm.PropertyPath";
    TermToTypes["Org.OData.Aggregation.V1.LeveledHierarchy"] = "Edm.PropertyPath";
    TermToTypes["Org.OData.Aggregation.V1.RecursiveHierarchy"] = "Org.OData.Aggregation.V1.RecursiveHierarchyType";
    TermToTypes["Org.OData.Aggregation.V1.AvailableOnAggregates"] = "Org.OData.Aggregation.V1.AvailableOnAggregatesType";
    TermToTypes["Org.OData.Validation.V1.Minimum"] = "Edm.PrimitiveType";
    TermToTypes["Org.OData.Validation.V1.Maximum"] = "Edm.PrimitiveType";
    TermToTypes["Org.OData.Validation.V1.Exclusive"] = "Org.OData.Core.V1.Tag";
    TermToTypes["Org.OData.Validation.V1.AllowedValues"] = "Org.OData.Validation.V1.AllowedValue";
    TermToTypes["Org.OData.Validation.V1.MultipleOf"] = "Edm.Decimal";
    TermToTypes["Org.OData.Validation.V1.Constraint"] = "Org.OData.Validation.V1.ConstraintType";
    TermToTypes["Org.OData.Validation.V1.ItemsOf"] = "Org.OData.Validation.V1.ItemsOfType";
    TermToTypes["Org.OData.Validation.V1.OpenPropertyTypeConstraint"] = "Org.OData.Validation.V1.SingleOrCollectionType";
    TermToTypes["Org.OData.Validation.V1.DerivedTypeConstraint"] = "Org.OData.Validation.V1.SingleOrCollectionType";
    TermToTypes["Org.OData.Validation.V1.AllowedTerms"] = "Org.OData.Core.V1.QualifiedTermName";
    TermToTypes["Org.OData.Validation.V1.ApplicableTerms"] = "Org.OData.Core.V1.QualifiedTermName";
    TermToTypes["Org.OData.Validation.V1.MaxItems"] = "Edm.Int64";
    TermToTypes["Org.OData.Validation.V1.MinItems"] = "Edm.Int64";
    TermToTypes["Org.OData.Measures.V1.Scale"] = "Edm.Byte";
    TermToTypes["Org.OData.Measures.V1.DurationGranularity"] = "Org.OData.Measures.V1.DurationGranularityType";
    TermToTypes["com.sap.vocabularies.Analytics.v1.Dimension"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Analytics.v1.Measure"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Analytics.v1.AccumulativeMeasure"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Analytics.v1.RolledUpPropertyCount"] = "Edm.Int16";
    TermToTypes["com.sap.vocabularies.Analytics.v1.PlanningAction"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Analytics.v1.AggregatedProperties"] = "com.sap.vocabularies.Analytics.v1.AggregatedPropertyType";
    TermToTypes["com.sap.vocabularies.Analytics.v1.AggregatedProperty"] = "com.sap.vocabularies.Analytics.v1.AggregatedPropertyType";
    TermToTypes["com.sap.vocabularies.Analytics.v1.AnalyticalContext"] = "com.sap.vocabularies.Analytics.v1.AnalyticalContextType";
    TermToTypes["com.sap.vocabularies.Common.v1.ServiceVersion"] = "Edm.Int32";
    TermToTypes["com.sap.vocabularies.Common.v1.ServiceSchemaVersion"] = "Edm.Int32";
    TermToTypes["com.sap.vocabularies.Common.v1.TextFor"] = "Edm.PropertyPath";
    TermToTypes["com.sap.vocabularies.Common.v1.IsLanguageIdentifier"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.TextFormat"] = "com.sap.vocabularies.Common.v1.TextFormatType";
    TermToTypes["com.sap.vocabularies.Common.v1.IsTimezone"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsDigitSequence"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsUpperCase"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsCurrency"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsUnit"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.UnitSpecificScale"] = "Edm.PrimitiveType";
    TermToTypes["com.sap.vocabularies.Common.v1.UnitSpecificPrecision"] = "Edm.PrimitiveType";
    TermToTypes["com.sap.vocabularies.Common.v1.SecondaryKey"] = "Edm.PropertyPath";
    TermToTypes["com.sap.vocabularies.Common.v1.MinOccurs"] = "Edm.Int64";
    TermToTypes["com.sap.vocabularies.Common.v1.MaxOccurs"] = "Edm.Int64";
    TermToTypes["com.sap.vocabularies.Common.v1.AssociationEntity"] = "Edm.NavigationPropertyPath";
    TermToTypes["com.sap.vocabularies.Common.v1.DerivedNavigation"] = "Edm.NavigationPropertyPath";
    TermToTypes["com.sap.vocabularies.Common.v1.Masked"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.RevealOnDemand"] = "Edm.Boolean";
    TermToTypes["com.sap.vocabularies.Common.v1.SemanticObjectMapping"] = "com.sap.vocabularies.Common.v1.SemanticObjectMappingAbstract";
    TermToTypes["com.sap.vocabularies.Common.v1.IsInstanceAnnotation"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.FilterExpressionRestrictions"] = "com.sap.vocabularies.Common.v1.FilterExpressionRestrictionType";
    TermToTypes["com.sap.vocabularies.Common.v1.FieldControl"] = "com.sap.vocabularies.Common.v1.FieldControlType";
    TermToTypes["com.sap.vocabularies.Common.v1.Application"] = "com.sap.vocabularies.Common.v1.ApplicationType";
    TermToTypes["com.sap.vocabularies.Common.v1.Timestamp"] = "Edm.DateTimeOffset";
    TermToTypes["com.sap.vocabularies.Common.v1.ErrorResolution"] = "com.sap.vocabularies.Common.v1.ErrorResolutionType";
    TermToTypes["com.sap.vocabularies.Common.v1.Messages"] = "Edm.ComplexType";
    TermToTypes["com.sap.vocabularies.Common.v1.numericSeverity"] = "com.sap.vocabularies.Common.v1.NumericMessageSeverityType";
    TermToTypes["com.sap.vocabularies.Common.v1.MaximumNumericMessageSeverity"] = "com.sap.vocabularies.Common.v1.NumericMessageSeverityType";
    TermToTypes["com.sap.vocabularies.Common.v1.IsActionCritical"] = "Edm.Boolean";
    TermToTypes["com.sap.vocabularies.Common.v1.Attributes"] = "Edm.PropertyPath";
    TermToTypes["com.sap.vocabularies.Common.v1.RelatedRecursiveHierarchy"] = "Edm.AnnotationPath";
    TermToTypes["com.sap.vocabularies.Common.v1.Interval"] = "com.sap.vocabularies.Common.v1.IntervalType";
    TermToTypes["com.sap.vocabularies.Common.v1.ResultContext"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.SAPObjectNodeType"] = "com.sap.vocabularies.Common.v1.SAPObjectNodeTypeType";
    TermToTypes["com.sap.vocabularies.Common.v1.Composition"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsNaturalPerson"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.ValueList"] = "com.sap.vocabularies.Common.v1.ValueListType";
    TermToTypes["com.sap.vocabularies.Common.v1.ValueListRelevantQualifiers"] = "Org.OData.Core.V1.SimpleIdentifier";
    TermToTypes["com.sap.vocabularies.Common.v1.ValueListWithFixedValues"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.ValueListShowValuesImmediately"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.ValueListMapping"] = "com.sap.vocabularies.Common.v1.ValueListMappingType";
    TermToTypes["com.sap.vocabularies.Common.v1.IsCalendarYear"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsCalendarHalfyear"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsCalendarQuarter"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsCalendarMonth"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsCalendarWeek"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsDayOfCalendarMonth"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsDayOfCalendarYear"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsCalendarYearHalfyear"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsCalendarYearQuarter"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsCalendarYearMonth"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsCalendarYearWeek"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsCalendarDate"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsFiscalYear"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsFiscalPeriod"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsFiscalYearPeriod"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsFiscalQuarter"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsFiscalYearQuarter"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsFiscalWeek"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsFiscalYearWeek"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsDayOfFiscalYear"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.IsFiscalYearVariant"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.MutuallyExclusiveTerm"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.DraftRoot"] = "com.sap.vocabularies.Common.v1.DraftRootType";
    TermToTypes["com.sap.vocabularies.Common.v1.DraftNode"] = "com.sap.vocabularies.Common.v1.DraftNodeType";
    TermToTypes["com.sap.vocabularies.Common.v1.DraftActivationVia"] = "Org.OData.Core.V1.SimpleIdentifier";
    TermToTypes["com.sap.vocabularies.Common.v1.EditableFieldFor"] = "Edm.PropertyPath";
    TermToTypes["com.sap.vocabularies.Common.v1.SemanticKey"] = "Edm.PropertyPath";
    TermToTypes["com.sap.vocabularies.Common.v1.SideEffects"] = "com.sap.vocabularies.Common.v1.SideEffectsType";
    TermToTypes["com.sap.vocabularies.Common.v1.DefaultValuesFunction"] = "com.sap.vocabularies.Common.v1.QualifiedName";
    TermToTypes["com.sap.vocabularies.Common.v1.FilterDefaultValue"] = "Edm.PrimitiveType";
    TermToTypes["com.sap.vocabularies.Common.v1.FilterDefaultValueHigh"] = "Edm.PrimitiveType";
    TermToTypes["com.sap.vocabularies.Common.v1.SortOrder"] = "com.sap.vocabularies.Common.v1.SortOrderType";
    TermToTypes["com.sap.vocabularies.Common.v1.RecursiveHierarchy"] = "com.sap.vocabularies.Common.v1.RecursiveHierarchyType";
    TermToTypes["com.sap.vocabularies.Common.v1.CreatedAt"] = "Edm.DateTimeOffset";
    TermToTypes["com.sap.vocabularies.Common.v1.CreatedBy"] = "com.sap.vocabularies.Common.v1.UserID";
    TermToTypes["com.sap.vocabularies.Common.v1.ChangedAt"] = "Edm.DateTimeOffset";
    TermToTypes["com.sap.vocabularies.Common.v1.ChangedBy"] = "com.sap.vocabularies.Common.v1.UserID";
    TermToTypes["com.sap.vocabularies.Common.v1.ApplyMultiUnitBehaviorForSortingAndFiltering"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Common.v1.PrimitivePropertyPath"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.CodeList.v1.CurrencyCodes"] = "com.sap.vocabularies.CodeList.v1.CodeListSource";
    TermToTypes["com.sap.vocabularies.CodeList.v1.UnitsOfMeasure"] = "com.sap.vocabularies.CodeList.v1.CodeListSource";
    TermToTypes["com.sap.vocabularies.CodeList.v1.StandardCode"] = "Edm.PropertyPath";
    TermToTypes["com.sap.vocabularies.CodeList.v1.ExternalCode"] = "Edm.PropertyPath";
    TermToTypes["com.sap.vocabularies.CodeList.v1.IsConfigurationDeprecationCode"] = "Edm.Boolean";
    TermToTypes["com.sap.vocabularies.Communication.v1.Contact"] = "com.sap.vocabularies.Communication.v1.ContactType";
    TermToTypes["com.sap.vocabularies.Communication.v1.Address"] = "com.sap.vocabularies.Communication.v1.AddressType";
    TermToTypes["com.sap.vocabularies.Communication.v1.IsEmailAddress"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Communication.v1.IsPhoneNumber"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Communication.v1.Event"] = "com.sap.vocabularies.Communication.v1.EventData";
    TermToTypes["com.sap.vocabularies.Communication.v1.Task"] = "com.sap.vocabularies.Communication.v1.TaskData";
    TermToTypes["com.sap.vocabularies.Communication.v1.Message"] = "com.sap.vocabularies.Communication.v1.MessageData";
    TermToTypes["com.sap.vocabularies.Hierarchy.v1.RecursiveHierarchy"] = "com.sap.vocabularies.Hierarchy.v1.RecursiveHierarchyType";
    TermToTypes["com.sap.vocabularies.Hierarchy.v1.RecursiveHierarchyActions"] = "com.sap.vocabularies.Hierarchy.v1.RecursiveHierarchyActionsType";
    TermToTypes["com.sap.vocabularies.Hierarchy.v1.MatchCount"] = "Edm.Int64";
    TermToTypes["com.sap.vocabularies.Hierarchy.v1.RecursiveHierarchySupported"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.PersonalData.v1.EntitySemantics"] = "com.sap.vocabularies.PersonalData.v1.EntitySemanticsType";
    TermToTypes["com.sap.vocabularies.PersonalData.v1.FieldSemantics"] = "com.sap.vocabularies.PersonalData.v1.FieldSemanticsType";
    TermToTypes["com.sap.vocabularies.PersonalData.v1.IsPotentiallyPersonal"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.PersonalData.v1.IsPotentiallySensitive"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.Session.v1.StickySessionSupported"] = "com.sap.vocabularies.Session.v1.StickySessionSupportedType";
    TermToTypes["com.sap.vocabularies.UI.v1.HeaderInfo"] = "com.sap.vocabularies.UI.v1.HeaderInfoType";
    TermToTypes["com.sap.vocabularies.UI.v1.Identification"] = "com.sap.vocabularies.UI.v1.DataFieldAbstract";
    TermToTypes["com.sap.vocabularies.UI.v1.Badge"] = "com.sap.vocabularies.UI.v1.BadgeType";
    TermToTypes["com.sap.vocabularies.UI.v1.LineItem"] = "com.sap.vocabularies.UI.v1.DataFieldAbstract";
    TermToTypes["com.sap.vocabularies.UI.v1.StatusInfo"] = "com.sap.vocabularies.UI.v1.DataFieldAbstract";
    TermToTypes["com.sap.vocabularies.UI.v1.FieldGroup"] = "com.sap.vocabularies.UI.v1.FieldGroupType";
    TermToTypes["com.sap.vocabularies.UI.v1.ConnectedFields"] = "com.sap.vocabularies.UI.v1.ConnectedFieldsType";
    TermToTypes["com.sap.vocabularies.UI.v1.GeoLocations"] = "com.sap.vocabularies.UI.v1.GeoLocationType";
    TermToTypes["com.sap.vocabularies.UI.v1.GeoLocation"] = "com.sap.vocabularies.UI.v1.GeoLocationType";
    TermToTypes["com.sap.vocabularies.UI.v1.Contacts"] = "Edm.AnnotationPath";
    TermToTypes["com.sap.vocabularies.UI.v1.MediaResource"] = "com.sap.vocabularies.UI.v1.MediaResourceType";
    TermToTypes["com.sap.vocabularies.UI.v1.DataPoint"] = "com.sap.vocabularies.UI.v1.DataPointType";
    TermToTypes["com.sap.vocabularies.UI.v1.KPI"] = "com.sap.vocabularies.UI.v1.KPIType";
    TermToTypes["com.sap.vocabularies.UI.v1.Chart"] = "com.sap.vocabularies.UI.v1.ChartDefinitionType";
    TermToTypes["com.sap.vocabularies.UI.v1.ValueCriticality"] = "com.sap.vocabularies.UI.v1.ValueCriticalityType";
    TermToTypes["com.sap.vocabularies.UI.v1.CriticalityLabels"] = "com.sap.vocabularies.UI.v1.CriticalityLabelType";
    TermToTypes["com.sap.vocabularies.UI.v1.SelectionFields"] = "Edm.PropertyPath";
    TermToTypes["com.sap.vocabularies.UI.v1.Facets"] = "com.sap.vocabularies.UI.v1.Facet";
    TermToTypes["com.sap.vocabularies.UI.v1.HeaderFacets"] = "com.sap.vocabularies.UI.v1.Facet";
    TermToTypes["com.sap.vocabularies.UI.v1.QuickViewFacets"] = "com.sap.vocabularies.UI.v1.Facet";
    TermToTypes["com.sap.vocabularies.UI.v1.QuickCreateFacets"] = "com.sap.vocabularies.UI.v1.Facet";
    TermToTypes["com.sap.vocabularies.UI.v1.FilterFacets"] = "com.sap.vocabularies.UI.v1.ReferenceFacet";
    TermToTypes["com.sap.vocabularies.UI.v1.SelectionPresentationVariant"] = "com.sap.vocabularies.UI.v1.SelectionPresentationVariantType";
    TermToTypes["com.sap.vocabularies.UI.v1.PresentationVariant"] = "com.sap.vocabularies.UI.v1.PresentationVariantType";
    TermToTypes["com.sap.vocabularies.UI.v1.SelectionVariant"] = "com.sap.vocabularies.UI.v1.SelectionVariantType";
    TermToTypes["com.sap.vocabularies.UI.v1.ThingPerspective"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.UI.v1.IsSummary"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.UI.v1.PartOfPreview"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.UI.v1.Map"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.UI.v1.Gallery"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.UI.v1.IsImageURL"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.UI.v1.IsImage"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.UI.v1.MultiLineText"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.UI.v1.InputMask"] = "com.sap.vocabularies.UI.v1.InputMaskType";
    TermToTypes["com.sap.vocabularies.UI.v1.TextArrangement"] = "com.sap.vocabularies.UI.v1.TextArrangementType";
    TermToTypes["com.sap.vocabularies.UI.v1.Note"] = "com.sap.vocabularies.UI.v1.NoteType";
    TermToTypes["com.sap.vocabularies.UI.v1.Importance"] = "com.sap.vocabularies.UI.v1.ImportanceType";
    TermToTypes["com.sap.vocabularies.UI.v1.Hidden"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.UI.v1.IsCopyAction"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.UI.v1.IsAIOperation"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.UI.v1.CreateHidden"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.UI.v1.UpdateHidden"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.UI.v1.DeleteHidden"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.UI.v1.HiddenFilter"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.UI.v1.AdaptationHidden"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.UI.v1.DataFieldDefault"] = "com.sap.vocabularies.UI.v1.DataFieldAbstract";
    TermToTypes["com.sap.vocabularies.UI.v1.Criticality"] = "com.sap.vocabularies.UI.v1.CriticalityType";
    TermToTypes["com.sap.vocabularies.UI.v1.CriticalityCalculation"] = "com.sap.vocabularies.UI.v1.CriticalityCalculationType";
    TermToTypes["com.sap.vocabularies.UI.v1.Emphasized"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.UI.v1.OrderBy"] = "Edm.PropertyPath";
    TermToTypes["com.sap.vocabularies.UI.v1.ParameterDefaultValue"] = "Edm.PrimitiveType";
    TermToTypes["com.sap.vocabularies.UI.v1.RecommendationState"] = "com.sap.vocabularies.UI.v1.RecommendationStateType";
    TermToTypes["com.sap.vocabularies.UI.v1.RecommendationList"] = "com.sap.vocabularies.UI.v1.RecommendationListType";
    TermToTypes["com.sap.vocabularies.UI.v1.Recommendations"] = "Edm.ComplexType";
    TermToTypes["com.sap.vocabularies.UI.v1.ExcludeFromNavigationContext"] = "Org.OData.Core.V1.Tag";
    TermToTypes["com.sap.vocabularies.UI.v1.DoNotCheckScaleOfMeasuredQuantity"] = "Edm.Boolean";
    TermToTypes["com.sap.vocabularies.HTML5.v1.CssDefaults"] = "com.sap.vocabularies.HTML5.v1.CssDefaultsType";
    TermToTypes["com.sap.vocabularies.HTML5.v1.LinkTarget"] = "com.sap.vocabularies.HTML5.v1.LinkTargetType";
    TermToTypes["com.sap.vocabularies.HTML5.v1.RowSpanForDuplicateValues"] = "Org.OData.Core.V1.Tag";
})(TermToTypes = exports.TermToTypes || (exports.TermToTypes = {}));


/***/ }),

/***/ 42:
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VocabularyReferences = void 0;
/**
 * The list of vocabularies with default aliases.
 */
exports.VocabularyReferences = [
    { alias: "Authorization", namespace: "Org.OData.Authorization.V1", uri: "https://oasis-tcs.github.io/odata-vocabularies/vocabularies/Org.OData.Authorization.V1.xml" },
    { alias: "Core", namespace: "Org.OData.Core.V1", uri: "https://oasis-tcs.github.io/odata-vocabularies/vocabularies/Org.OData.Core.V1.xml" },
    { alias: "Capabilities", namespace: "Org.OData.Capabilities.V1", uri: "https://oasis-tcs.github.io/odata-vocabularies/vocabularies/Org.OData.Capabilities.V1.xml" },
    { alias: "Aggregation", namespace: "Org.OData.Aggregation.V1", uri: "https://oasis-tcs.github.io/odata-vocabularies/vocabularies/Org.OData.Aggregation.V1.xml" },
    { alias: "Validation", namespace: "Org.OData.Validation.V1", uri: "https://oasis-tcs.github.io/odata-vocabularies/vocabularies/Org.OData.Validation.V1.xml" },
    { alias: "Measures", namespace: "Org.OData.Measures.V1", uri: "https://oasis-tcs.github.io/odata-vocabularies/vocabularies/Org.OData.Measures.V1.xml" },
    { alias: "Analytics", namespace: "com.sap.vocabularies.Analytics.v1", uri: "https://sap.github.io/odata-vocabularies/vocabularies/Analytics.xml" },
    { alias: "Common", namespace: "com.sap.vocabularies.Common.v1", uri: "https://sap.github.io/odata-vocabularies/vocabularies/Common.xml" },
    { alias: "CodeList", namespace: "com.sap.vocabularies.CodeList.v1", uri: "https://sap.github.io/odata-vocabularies/vocabularies/CodeList.xml" },
    { alias: "Communication", namespace: "com.sap.vocabularies.Communication.v1", uri: "https://sap.github.io/odata-vocabularies/vocabularies/Communication.xml" },
    { alias: "Hierarchy", namespace: "com.sap.vocabularies.Hierarchy.v1", uri: "https://sap.github.io/odata-vocabularies/vocabularies/Hierarchy.xml" },
    { alias: "PersonalData", namespace: "com.sap.vocabularies.PersonalData.v1", uri: "https://sap.github.io/odata-vocabularies/vocabularies/PersonalData.xml" },
    { alias: "Session", namespace: "com.sap.vocabularies.Session.v1", uri: "https://sap.github.io/odata-vocabularies/vocabularies/Session.xml" },
    { alias: "UI", namespace: "com.sap.vocabularies.UI.v1", uri: "https://sap.github.io/odata-vocabularies/vocabularies/UI.xml" },
    { alias: "HTML5", namespace: "com.sap.vocabularies.HTML5.v1", uri: "https://sap.github.io/odata-vocabularies/vocabularies/HTML5.xml" }
];


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(131);
/******/ 	AnnotationConverter = __webpack_exports__;
/******/ 	
/******/ })()
;

    return AnnotationConverter;
 },true);
 //# sourceMappingURL=AnnotationConverter-dbg.js.map
