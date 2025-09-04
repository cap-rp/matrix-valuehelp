import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import type { Button$PressEvent } from "sap/m/Button";
import Button from "sap/m/Button";
import type Link from "sap/m/Link";
import OverflowToolbar from "sap/m/OverflowToolbar";
import Popover from "sap/m/Popover";
import Text from "sap/m/Text";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import VBox from "sap/m/VBox";
import { ButtonType, PlacementType } from "sap/m/library";

/**
 * Tiny component to display a link that opens a popover with the AI notice.
 * @param props
 * @param props.resourceBundle
 * @returns The AI Notice component
 */
function AINotice(props: { resourceBundle: ResourceBundle }): Link {
	return (
		<Button
			text={props.resourceBundle.getText("M_EASY_FILTER_FILTER_SET_AI")}
			icon="sap-icon://ai"
			type={ButtonType.Transparent}
			press={(e: Button$PressEvent): void => {
				const $disclaimerPopover: Popover = (
					<Popover
						contentWidth={"22.8125rem"}
						showArrow={true}
						showHeader={true}
						placement={PlacementType.Bottom}
						title={props.resourceBundle.getText("M_EASY_FILTER_POPOVER_AI_TITLE")}
					>
						{{
							content: (
								<VBox>
									<Text
										class="sapFeControlsAiPopoverText1"
										text={props.resourceBundle.getText("M_EASY_FILTER_POPOVER_AI_TEXT_1")}
									/>
									<Text
										class="sapFeControlsAiPopoverText2"
										text={props.resourceBundle.getText("M_EASY_FILTER_POPOVER_AI_TEXT_2")}
									/>
								</VBox>
							),
							footer: (
								<OverflowToolbar>
									{{
										content: (
											<>
												<ToolbarSpacer />
												<Button
													text={props.resourceBundle.getText("M_EASY_FILTER_POPOVER_CLOSE")}
													press={(): void => {
														$disclaimerPopover?.close();
													}}
												/>
											</>
										)
									}}
								</OverflowToolbar>
							)
						}}
					</Popover>
				) as Popover;
				$disclaimerPopover.openBy(e.getSource());
			}}
		/>
	);
}

export default AINotice;
