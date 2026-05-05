class ErrorHandler extends Error {
	constructor(message, statusCode) {
		super(message);
		this.message = message;
		this.statusCode = statusCode;

		// Error.captureStackTrace(this, message);
	}
}

module.exports = ErrorHandler;
