import {
initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
sendPasswordResetEmail,
updateProfile,
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

/* =========================================
FIREBASE CONFIG
========================================= */

const firebaseConfig = {


apiKey:
    "AIzaSyAX5v1-Fq-ujlFdxI_K-nqOq7RnI_xDFMw",

authDomain:
    "battle-arena-64da6.firebaseapp.com",

projectId:
    "battle-arena-64da6",

storageBucket:
    "battle-arena-64da6.firebasestorage.app",

messagingSenderId:
    "17903384440",

appId:
    "1:17903384440:web:05998e4b7187752891ba8d",

measurementId:
    "G-QBP2VD2GGX"

};

/* =========================================
INITIALIZE FIREBASE
========================================= */

const firebaseApp =
initializeApp(
firebaseConfig
);

const auth =
getAuth(
firebaseApp
);

/* =========================================
ELEMENTS
========================================= */

const authPage =
document.getElementById(
"authPage"
);

const homePage =
document.getElementById(
"homePage"
);

const loginTab =
document.getElementById(
"loginTab"
);

const registerTab =
document.getElementById(
"registerTab"
);

const loginForm =
document.getElementById(
"loginForm"
);

const registerForm =
document.getElementById(
"registerForm"
);

const message =
document.getElementById(
"message"
);

const forgotPassword =
document.getElementById(
"forgotPassword"
);

const loginButton =
document.getElementById(
"loginButton"
);

const registerButton =
document.getElementById(
"registerButton"
);

const logoutButton =
document.getElementById(
"logoutButton"
);

const dashboardButton =
document.getElementById(
"dashboardButton"
);

/* =========================================
MESSAGE
========================================= */

function showMessage(
text,
type = ""
) {


message.textContent =
    text;

message.className =
    "message";

if (type) {

    message.classList.add(
        type
    );

}

}

/* =========================================
SHOW LOGIN
========================================= */

function showLogin() {


loginTab.classList.add(
    "active"
);

registerTab.classList.remove(
    "active"
);

loginForm.classList.remove(
    "hidden"
);

registerForm.classList.add(
    "hidden"
);

showMessage(
    ""
);


}

/* =========================================
SHOW REGISTER
========================================= */

function showRegister() {


registerTab.classList.add(
    "active"
);

loginTab.classList.remove(
    "active"
);

registerForm.classList.remove(
    "hidden"
);

loginForm.classList.add(
    "hidden"
);

showMessage(
    ""
);


}

/* =========================================
LOGIN TAB
========================================= */

loginTab.addEventListener(
"click",
showLogin
);

/* =========================================
REGISTER TAB
========================================= */

registerTab.addEventListener(
"click",
showRegister
);

/* =========================================
LOGIN
========================================= */

loginForm.addEventListener(
"submit",
async function (event) {


    event.preventDefault();


    const email =
        document.getElementById(
            "loginEmail"
        ).value.trim();


    const password =
        document.getElementById(
            "loginPassword"
        ).value;


    loginButton.disabled =
        true;


    showMessage(
        "LOGGING IN..."
    );


    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );


        showMessage(
            "LOGIN SUCCESSFUL.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        showMessage(
            getFriendlyError(
                error
            ),
            "error"
        );

    }

    finally {

        loginButton.disabled =
            false;

    }

}


);

/* =========================================
REGISTER
========================================= */

registerForm.addEventListener(
"submit",
async function (event) {


    event.preventDefault();


    const username =
        document.getElementById(
            "registerUsername"
        ).value.trim();


    const email =
        document.getElementById(
            "registerEmail"
        ).value.trim();


    const password =
        document.getElementById(
            "registerPassword"
        ).value;


    const confirmPassword =
        document.getElementById(
            "registerConfirm"
        ).value;


    if (
        username.length < 3
    ) {

        showMessage(
            "USERNAME MUST BE AT LEAST 3 CHARACTERS.",
            "error"
        );

        return;
    }


    if (
        password !==
        confirmPassword
    ) {

        showMessage(
            "PASSWORDS DO NOT MATCH.",
            "error"
        );

        return;
    }


    registerButton.disabled =
        true;


    showMessage(
        "CREATING ACCOUNT..."
    );


    try {

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        await updateProfile(
            userCredential.user,
            {
                displayName:
                    username
            }
        );


        showMessage(
            "ACCOUNT CREATED SUCCESSFULLY.",
            "success"
        );


        registerForm.reset();

    }

    catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );

        showMessage(
            getFriendlyError(
                error
            ),
            "error"
        );

    }

    finally {

        registerButton.disabled =
            false;

    }

}


);

/* =========================================
FORGOT PASSWORD
========================================= */

forgotPassword.addEventListener(
"click",
async function () {


    const email =
        document.getElementById(
            "loginEmail"
        ).value.trim();


    if (!email) {

        showMessage(
            "ENTER YOUR EMAIL FIRST.",
            "error"
        );

        return;
    }


    showMessage(
        "SENDING RESET EMAIL..."
    );


    try {

        await sendPasswordResetEmail(
            auth,
            email
        );


        showMessage(
            "PASSWORD RESET EMAIL SENT.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "RESET PASSWORD ERROR:",
            error
        );

        showMessage(
            getFriendlyError(
                error
            ),
            "error"
        );

    }

}


);

/* =========================================
AUTH STATE
========================================= */

onAuthStateChanged(
auth,
function (user) {


    if (user) {

        authPage.classList.add(
            "hidden"
        );

        homePage.classList.remove(
            "hidden"
        );

    } else {

        authPage.classList.remove(
            "hidden"
        );

        homePage.classList.add(
            "hidden"
        );

    }

}


);

/* =========================================
LOGOUT
========================================= */

logoutButton.addEventListener(
"click",
async function () {


    try {

        await signOut(
            auth
        );

    }

    catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );

        showMessage(
            "LOGOUT FAILED.",
            "error"
        );

    }

}


);

/* =========================================
DASHBOARD
========================================= */

  dashboardButton.addEventListener(
    "click",
    function () {

        window.location.href =
            "dashboard.html";

    }
); 


/* =========================================
FRIENDLY FIREBASE ERRORS
========================================= */

function getFriendlyError(
error
) {


switch (
    error.code
) {

    case "auth/email-already-in-use":

        return (
            "THIS EMAIL IS ALREADY REGISTERED."
        );


    case "auth/invalid-email":

        return (
            "PLEASE ENTER A VALID EMAIL."
        );


    case "auth/weak-password":

        return (
            "PASSWORD IS TOO WEAK."
        );


    case "auth/invalid-credential":

        return (
            "INVALID EMAIL OR PASSWORD."
        );


    case "auth/user-not-found":

        return (
            "ACCOUNT NOT FOUND."
        );


    case "auth/wrong-password":

        return (
            "INCORRECT PASSWORD."
        );


    case "auth/too-many-requests":

        return (
            "TOO MANY ATTEMPTS. TRY AGAIN LATER."
        );


    default:

        return (
            error.message ||
            "AN ERROR OCCURRED."
        );

}


}
