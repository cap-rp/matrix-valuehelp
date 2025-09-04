/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/base/jsx-runtime/ViewLoader", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor", "sap/fe/macros/macroLibrary", "sap/m/FormattedText", "sap/m/HBox", "sap/m/Page", "sap/m/Panel", "sap/m/Title", "sap/ui/codeeditor/CodeEditor", "sap/ui/core/Component", "sap/ui/core/Fragment", "sap/ui/core/library", "sap/ui/core/util/XMLPreprocessor", "sap/fe/base/jsx-runtime/jsx"], function (Log, ClassSupport, MDXViewLoader, BuildingBlockTemplateProcessor, macroLibrary, FormattedText, HBox, Page, Panel, Title, CodeEditor, Component, Fragment, library, XMLPreprocessor, _jsx) {
  "use strict";

  var TitleLevel = library.TitleLevel;
  var parseXMLString = BuildingBlockTemplateProcessor.parseXMLString;
  var createReference = ClassSupport.createReference;
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  function p(strValue) {
    const content = Array.isArray(strValue.children) ? strValue.children.map(child => {
      let output;
      if (typeof child === "string") {
        output = child;
      } else {
        switch (child.getMetadata().getName()) {
          case "sap.m.Link":
            output = `<a href="${child.getHref()}">${child.getText()}</a>`;
            break;
          case "sap.ui.codeeditor.CodeEditor":
            output = `<code>${child.getValue()}</code>`;
            break;
        }
      }
      return output;
    }).join("") : strValue.children;
    return _jsx(FormattedText, {
      htmlText: content,
      class: "sapUiTinyMarginBottom"
    });
  }
  function wrapper(strValue) {
    return _jsx(Page, {
      class: "sapUiContentPadding",
      children: {
        content: strValue.children
      }
    });
  }
  function h1(strValue) {
    return _jsx(Title, {
      text: strValue.children,
      level: TitleLevel.H1,
      class: "sapUiTinyMarginBottom"
    });
  }
  function a(strValue) {
    return `<a href={strValue.href}>${strValue.children}</a>`;
  }
  function ul(strValue) {
    const ulContent = `<ul>${Array.isArray(strValue.children) ? strValue.children.join("") : strValue.children}</ul>`;
    return _jsx(FormattedText, {
      htmlText: ulContent
    });
  }
  function li(strValue) {
    return `<li>${Array.isArray(strValue.children) ? strValue.children.join("") : strValue.children}</li>`;
  }
  function h2(strValue) {
    return _jsx(Title, {
      text: strValue.children,
      level: TitleLevel.H2,
      class: "sapUiSmallMarginTop sapUiTinyMarginBottom"
    });
  }
  function pre(content) {
    return content.children;
  }
  function BuildingBlockPlayground(inValue) {
    const sourceHBox = createReference();
    const binding = inValue.binding ? {
      path: inValue.binding
    } : undefined;
    const target = _jsx(Panel, {
      headerText: inValue.headerText || "",
      class: "sapUiSmallMarginTop",
      children: _jsx(HBox, {
        ref: sourceHBox
      })
    });
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
    const fragmentOrPromise = XMLPreprocessor.process(parseXMLString(`<root>${inValue.children}</root>`, true)[0], {
      name: "myBuildingBlockFragment"
    }, MDXViewLoader.preprocessorData);
    Promise.resolve(fragmentOrPromise).then(async fragment => {
      const owner = Component.getOwnerComponentFor(target) ?? {
        getRootControl: () => undefined
      };
      return Fragment.load({
        definition: fragment.firstElementChild,
        containingView: owner.getRootControl()
      });
    }).then(fragmentContent => {
      sourceHBox.current?.removeAllItems();
      sourceHBox.current?.addItem(fragmentContent);
      return;
    }).catch(err => {
      Log.error(err);
    });
    return target;
  }
  function CodeBlock(inValue) {
    const snippet = inValue.children?.trim() || "";
    const lineCount = inValue.lineCount || Math.max(snippet.split("\n")?.length, 3);
    const type = inValue.type || inValue?.className?.split("-")[1] || "js";
    const myCodeEditor = _jsx(CodeEditor, {
      class: "sapUiTinyMargin",
      lineNumbers: inValue.lineNumbers || false,
      type: type,
      editable: inValue.editable || false,
      maxLines: lineCount,
      height: "auto",
      width: "98%"
    });
    myCodeEditor.setValue(snippet);
    if (inValue.source) {
      fetch(inValue.source).then(async res => res.text()).then(text => {
        let splittedText = text.split("\n");
        if (inValue.start) {
          splittedText = splittedText.slice(inValue.start - 1, inValue.end);
        }
        const newLineCount = Math.max(splittedText.length, 3);
        myCodeEditor.setMaxLines(newLineCount);
        myCodeEditor.setValue(splittedText.join("\n"));
        return;
      }).catch(e => {
        myCodeEditor.setValue(e.message);
      });
    }
    return myCodeEditor;
  }
  const provideComponenents = function () {
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
  return provideComponenents;
}, false);
//# sourceMappingURL=useMDXComponents-dbg.js.map
