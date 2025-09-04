import { defineUI5Class } from "sap/fe/base/ClassSupport";
import Library from "sap/ui/core/Lib";
import ODataStringType from "sap/ui/model/odata/type/String";
import ValidateException from "sap/ui/model/ValidateException";

// To prevent Catastrophic Backtracking, the email validation is done using the W3C standard
// we split the email into local part and domain part to validate them separately and reduce the complexity of the regex
// Below is the RFC 3696 – Section 3:
// In addition to restrictions on syntax, there is a length limit on email addresses.
// That limit is a maximum of 64 characters(octets) in the « local part » (before the « @ ») and a maximum of 255 characters(octets) in the domain part(after the « @ ») for a total length of 320 characters.
// Systems that handle email should be prepared to process addresses which are that long, even though they are rarely encountered

const emailW3CRegexpLocalPart = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}/; // local part before the @
const emailW3CRegexpSubDomainPart = /[a-zA-Z0-9-]{1,255}/; // domain part after the @ but without the dot

@defineUI5Class("sap.fe.core.type.Email")
class EmailType extends ODataStringType {
	validateValue(value: string): void {
		const emailParts = value.split("@");
		const emailLocalPart = emailParts?.[0];
		const emailDomainPart = emailParts?.[1];
		if (
			value &&
			(!emailLocalPart ||
				!emailDomainPart ||
				!emailW3CRegexpLocalPart.test(emailLocalPart) ||
				!emailDomainPart.split(".").every((subDomain) => emailW3CRegexpSubDomainPart.test(subDomain)) ||
				emailParts.length !== 2)
		) {
			throw new ValidateException(Library.getResourceBundleFor("sap.fe.core")!.getText("T_EMAILTYPE_INVALID_VALUE"));
		}
		super.validateValue(value);
	}
}
export default EmailType;
