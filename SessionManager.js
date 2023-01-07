const crypto = require('crypto');

class SessionError extends Error {};

function SessionManager (){
	// default session length - you might want to
	// set this to something small during development
	const CookieMaxAgeMs = 600000;

	// keeping the session data inside a closure to keep them protected
	const sessions = {};

	// might be worth thinking about why we create these functions
	// as anonymous functions (per each instance) and not as prototype methods
	this.createSession = (response, username, maxAge = CookieMaxAgeMs) => {
		/* To be implemented */
        var result = crypto.randomBytes(32).toString("hex");
        var obj = {
            username:username,
            timestamp:Date.now(),
            expire_timestamp : (Date.now + maxAge)
        }
        sessions[result]=obj;
        response.cookie("cpen322-session", result, {maxAge : maxAge});
        setTimeout(()=>{
            delete(sessions[result]);
        }, maxAge);
    };
	

	this.deleteSession = (request) => {
		/* To be implemented */
        delete sessions[request.session];
        delete request.username
        delete request.session;
	};

	this.middleware = (request, response, next) => {
		/* To be implemented */
        var cookie_string = request.headers.cookie
        if(cookie_string == null){
            next(new SessionError("not in header"))
            return
        }
        cookie_string = cookie_string.split(';').map(s => s.split('=').pop().trim()).shift();
        if(sessions[cookie_string]){
            let cookie_in_session = sessions[cookie_string];
            request.username = cookie_in_session.username;
            request.session = cookie_string;
            next();
            return 
        }
        next(new SessionError("not in session"));
        return   
	};

	// this function is used by the test script.
	// you can use it if you want.
	this.getUsername = (token) => ((token in sessions) ? sessions[token].username : null);
};

// SessionError class is available to other modules as "SessionManager.Error"
SessionManager.Error = SessionError;

module.exports = SessionManager;