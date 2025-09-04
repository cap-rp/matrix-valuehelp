import Log from "sap/base/Log";
import { createReference } from "sap/fe/base/ClassSupport";
import MDXViewLoader from "sap/fe/base/jsx-runtime/ViewLoader";
import { parseXMLString } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import macroLibrary from "sap/fe/macros/macroLibrary";
import FormattedText from "sap/m/FormattedText";
import HBox from "sap/m/HBox";
import type Link from "sap/m/Link";
import Page from "sap/m/Page";
import Panel from "sap/m/Panel";
import Title from "sap/m/Title";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import CodeEditor from "sap/ui/codeeditor/CodeEditor";
import Component from "sap/ui/core/Component";
import type Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import type UIComponent from "sap/ui/core/UIComponent";
import { TitleLevel } from "sap/ui/core/library";
import type View from "sap/ui/core/mvc/View";
import XMLPreprocessor from "sap/ui/core/util/XMLPreprocessor";
function p(strValue: { children: (string | Control)[] }): string {
	const content = Array.isArray(strValue.children)
		? strValue.children
				.map((child: string | Control) => {
					let output;
					if (typeof child === "string") {
						output = child;
					} else {
						switch (child.getMetadata().getName()) {
							case "sap.m.Link":
								output = `<a href="${(child as Link).getHref()}">${(child as Link).getText()}</a>`;
								break;
							case "sap.ui.codeeditor.CodeEditor":
								output = `<code>${(child as CodeEditor).getValue()}</code>`;
								break;
						}
					}
					return output;
				})
				.join("")
		: strValue.children;
	return <FormattedText htmlText={content} class={"sapUiTinyMarginBottom"} />;
}

function wrapper(strValue: { children: Control[] }): Page {
	return (<Page class={"sapUiContentPadding"}>{{ content: strValue.children }}</Page>) as Page;
}
function h1(strValue: { children: string }): string {
	return <Title text={strValue.children} level={TitleLevel.H1} class={"sapUiTinyMarginBottom"} />;
}
function a(strValue: { href: string; children: string }): string {
	return `<a href={strValue.href}>${strValue.children}</a>`;
}
function ul(strValue: { children: string | string[] }): string {
	const ulContent = `<ul>${Array.isArray(strValue.children) ? strValue.children.join("") : strValue.children}</ul>`;
	return <FormattedText htmlText={ulContent} />;
}
function li(strValue: { children: string | string[] }): string {
	return `<li>${Array.isArray(strValue.children) ? strValue.children.join("") : strValue.children}</li>`;
}
function h2(strValue: { children: string | string[] }): string {
	return <Title text={strValue.children} level={TitleLevel.H2} class={"sapUiSmallMarginTop sapUiTinyMarginBottom"} />;
}
function pre(content: { children: string }): string {
	return content.children;
}

function BuildingBlockPlayground(inValue: { binding: string; headerText: string; children: string }): Control {
	const sourceHBox = createReference<HBox>();
	const binding = inValue.binding ? { path: inValue.binding } : undefined;
	const target = (
		<Panel headerText={inValue.headerText || ""} class={"sapUiSmallMarginTop"}>
			<HBox ref={sourceHBox}></HBox>
		</Panel>
	);
	// 	<TabContainer>
	// 		{{
	// 			items: [
	// 				<TabContainerItem name={"Sample"}>{{ content:  }},</TabContainerItem>,
	// 				<TabContainerItem name={"Source"}>
	// 					{{
	// 						content: (
	// 							<CodeBlock editable={false} lineNumbers={true} type={"xml"} lineCount={10}>
	// 								{inValue.children}
	// 							</CodeBlock>
	// 						)
	// 					}}
	// 				</TabContainerItem>
	// 			]
	// 		}}
	// 	</TabContainer>
	// );
	if (binding) {
		target.bindElement(binding);
	}
	macroLibrary.register();
	const fragmentOrPromise = XMLPreprocessor.process(
		parseXMLString(`<root>${inValue.children}</root>`, true)[0],
		{ name: "myBuildingBlockFragment" },
		MDXViewLoader.preprocessorData
	);
	Promise.resolve(fragmentOrPromise)
		.then(async (fragment: Element) => {
			const owner = (Component.getOwnerComponentFor(target) as UIComponent) ?? { getRootControl: (): unknown => undefined };
			return Fragment.load({
				definition: fragment.firstElementChild as unknown as string,
				containingView: owner.getRootControl() as unknown as View
			});
		})
		.then((fragmentContent: Control | Control[]): void => {
			sourceHBox.current?.removeAllItems();
			sourceHBox.current?.addItem(fragmentContent as Control);
			return;
		})
		.catch((err: unknown): void => {
			Log.error(err as string);
		});
	return target;
}
function CodeBlock(inValue: {
	children: string;
	lineNumbers?: boolean;
	type?: string;
	editable?: boolean;
	lineCount?: number;
	source?: string;
	start?: number;
	end?: number;
	className?: string;
}): CodeEditor {
	const snippet = inValue.children?.trim() || "";
	const lineCount = inValue.lineCount || Math.max(snippet.split("\n")?.length, 3);
	const type = inValue.type || inValue?.className?.split("-")[1] || "js";
	const myCodeEditor = (
		<CodeEditor
			class="sapUiTinyMargin"
			lineNumbers={inValue.lineNumbers || false}
			type={type}
			editable={inValue.editable || false}
			maxLines={lineCount}
			height={"auto"}
			width={"98%"}
		></CodeEditor>
	);
	myCodeEditor.setValue(snippet);
	if (inValue.source) {
		fetch(inValue.source)
			.then(async (res) => res.text())
			.then((text) => {
				let splittedText = text.split("\n");
				if (inValue.start) {
					splittedText = splittedText.slice(inValue.start - 1, inValue.end);
				}
				const newLineCount = Math.max(splittedText.length, 3);
				myCodeEditor.setMaxLines(newLineCount);
				myCodeEditor.setValue(splittedText.join("\n"));
				return;
			})
			.catch((e) => {
				myCodeEditor.setValue(e.message);
			});
	}
	return myCodeEditor;
}

const provideComponenents = function (): {
	wrapper: Function;
	p: Function;
	a: Function;
	h1: Function;
	h2: Function;
	ul: Function;
	li: Function;
	pre: Function;
	code: Function;
	CodeBlock: Function;
	BuildingBlockPlayground: Function;
} {
	return {
		wrapper: wrapper,
		p: p,
		a: a,
		h1: h1,
		h2: h2,
		ul: ul,
		li: li,
		pre: pre,
		code: CodeBlock,
		CodeBlock: CodeBlock,
		BuildingBlockPlayground: BuildingBlockPlayground
	};
};
export default provideComponenents;
