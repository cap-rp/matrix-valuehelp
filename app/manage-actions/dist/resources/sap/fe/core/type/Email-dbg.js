/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/core/Lib", "sap/ui/model/odata/type/String", "sap/ui/model/ValidateException"], function (ClassSupport, Library, ODataStringType, ValidateException) {
  "use strict";

  var _dec, _class;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  // To prevent Catastrophic Backtracking, the email validation is done using the W3C standard
  // we split the email into local part and domain part to validate them separately and reduce the complexity of the regex
  // Below is the RFC 3696 – Section 3:
  // In addition to restrictions on syntax, there is a length limit on email addresses.
  // That limit is a maximum of 64 characters(octets) in the « local part » (before the « @ ») and a maximum of 255 characters(octets) in the domain part(after the « @ ») for a total length of 320 characters.
  // Systems that handle email should be prepared to process addresses which are that long, even though they are rarely encountered

  const emailW3CRegexpLocalPart = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}/; // local part before the @
  const emailW3CRegexpSubDomainPart = /[a-zA-Z0-9-]{1,255}/; // domain part after the @ but without the dot
  let EmailType = (_dec = defineUI5Class("sap.fe.core.type.Email"), _dec(_class = /*#__PURE__*/function (_ODataStringType) {
    function EmailType() {
      return _ODataStringType.apply(this, arguments) || this;
    }
    _inheritsLoose(EmailType, _ODataStringType);
    var _proto = EmailType.prototype;
    _proto.validateValue = function validateValue(value) {
      const emailParts = value.split("@");
      const emailLocalPart = emailParts?.[0];
      const emailDomainPart = emailParts?.[1];
      if (value && (!emailLocalPart || !emailDomainPart || !emailW3CRegexpLocalPart.test(emailLocalPart) || !emailDomainPart.split(".").every(subDomain => emailW3CRegexpSubDomainPart.test(subDomain)) || emailParts.length !== 2)) {
        throw new ValidateException(Library.getResourceBundleFor("sap.fe.core").getText("T_EMAILTYPE_INVALID_VALUE"));
      }
      _ODataStringType.prototype.validateValue.call(this, value);
    };
    return EmailType;
  }(ODataStringType)) || _class);
  return EmailType;
}, false);
//# sourceMappingURL=Email-dbg.js.map
