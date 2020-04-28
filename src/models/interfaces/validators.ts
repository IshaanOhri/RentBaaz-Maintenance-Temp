
export function isEmailValid(email: string): boolean {
	const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return regex.test(email.toLowerCase());
}

export function isUsernameValid(username: string): boolean {
	// TODO
	return true;
}

export function isPasswordValid(password: string): boolean {
	// TODO password policy comes here
	return true;
}

export function isPhoneNumberValid(phoneNumber: string): boolean {
	return true;
}