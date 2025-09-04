import jsx from "sap/fe/base/jsx-runtime/jsx";
import jsxs from "sap/fe/base/jsx-runtime/jsxs";

/**
 * When coming from the JSX factory, the JSX factory will call this function with the type of the element, the props and the children.
 * The babel plugin expect this file to exist.
 */
export default { jsxs, jsx };
