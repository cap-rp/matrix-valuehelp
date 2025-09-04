export default {
	base64Decode: (base64: string): string => {
		return atob(base64);
	}
};
