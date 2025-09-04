import type { CompiledAdaptiveCardExpression } from "sap/fe/core/helpers/AdaptiveCardExpressionCompiler";
import type { CardColumn, CardColumnSet, CardElement, CardTextBlock, Image } from "types/adaptiveCard_types";

export type ColumnParams = {
	items: CardElement[];
	visible?: CompiledAdaptiveCardExpression | boolean;
	width?: number | string;
};

export type TextBlockParams = {
	size: string;
	weight?: string;
	text: string;
	maxLines?: number;
	wrap?: true;
	spacing?: string;
	visible?: CompiledAdaptiveCardExpression | boolean;
	color?: CompiledAdaptiveCardExpression;
	isSubtle?: boolean;
	$when?: string | null;
};

/**
 * Function to return columnSet object for the adaptive cards.
 * @param columns Columns for creating the column set
 * @param visible Visible expression for the column
 * @returns ColumnSet Object
 */
export function getColumnSet(columns?: CardColumn[], visible?: string | boolean): CardColumnSet {
	const items = columns ?? [];
	return {
		type: "ColumnSet",
		columns: [...items],
		isVisible: visible ?? undefined
	};
}

/**
 * Function to return column object for the adaptive cards.
 * @param parameters Parameters for creating the column
 * @returns Column Object
 */
export function getColumn(parameters?: ColumnParams): CardColumn {
	const items = parameters?.items ?? [];
	return {
		type: "Column",
		items: [...items],
		verticalContentAlignment: "Top",
		width: parameters?.width ?? 1,
		isVisible: parameters?.visible ?? undefined
	};
}

/**
 * Function to return image object for the adaptive cards.
 * @param url Image url
 * @returns Image Object
 */
export function getImage(url: string): Image {
	return {
		type: "Image",
		url: url,
		size: "Small"
	};
}

/**
 * Function to return TextBlock object for the adaptive cards.
 * @param parameters Parameters for creating the column
 * @returns TextBlock Object
 */
export function getTextBlock(parameters: TextBlockParams): CardTextBlock {
	return {
		type: "TextBlock",
		size: parameters?.size ?? "Small",
		weight: parameters?.weight ?? "Default",
		text: parameters?.text,
		maxLines: parameters?.maxLines ?? 0,
		wrap: parameters?.wrap ?? false,
		spacing: parameters?.spacing ?? "Default",
		isVisible: parameters?.visible ?? undefined,
		color: parameters?.color ?? "Default",
		isSubtle: parameters.isSubtle ?? undefined,
		$when: parameters?.$when ?? undefined
	};
}
