import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


/* =========================================
   FIREBASE
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


const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);


/* =========================================
   CLOUDINARY
========================================= */

const CLOUD_NAME =
    "p6502iog";

const UPLOAD_PRESET =
    "battle_arena_profiles";

const CLOUDINARY_UPLOAD_URL =
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;


/* =========================================
   ELEMENTS
========================================= */

const createProfilePanel =
    document.getElementById(
        "createProfilePanel"
    );

const profileCard =
    document.getElementById(
        "profileCard"
    );

const profileFormPanel =
    document.getElementById(
        "profileFormPanel"
    );

const startCreateBtn =
    document.getElementById(
        "startCreateBtn"
    );

const closeFormBtn =
    document.getElementById(
        "closeFormBtn"
    );

const editProfileBtn =
    document.getElementById(
        "editProfileBtn"
    );

const profileForm =
    document.getElementById(
        "profileForm"
    );

const avatarInput =
    document.getElementById(
        "avatarInput"
    );

const avatarPreview =
    document.getElementById(
        "avatarPreview"
    );

const avatarPlaceholder =
    document.getElementById(
        "avatarPlaceholder"
    );

const formStatus =
    document.getElementById(
        "formStatus"
    );

const saveProfileBtn =
    document.getElementById(
        "saveProfileBtn"
    );


/* =========================================
   STATE
========================================= */

let currentUser = null;

let existingAvatarUrl = "";


/* =========================================
   AUTH
========================================= */

onAuthStateChanged(
    auth,
    async function (user) {

        if (!user) {

            window.location.href =
                "index.html";

            return;
        }


        currentUser =
            user;


        await loadProfile();

    }
);


/* =========================================
   LOAD PROFILE
========================================= */

async function loadProfile() {

    try {

        const profileRef =
            doc(
                db,
                "profiles",
                currentUser.uid
            );


        const snapshot =
            await getDoc(
                profileRef
            );


        if (
            !snapshot.exists()
        ) {

            showCreatePanel();

            return;
        }


        const data =
            snapshot.data();


        existingAvatarUrl =
            data.avatarUrl || "";


        showProfile(data);

    }

    catch (error) {

        console.error(
            "PROFILE LOAD ERROR:",
            error
        );

        showStatus(
            "UNABLE TO LOAD PROFILE.",
            true
        );

    }

}


/* =========================================
   SHOW CREATE PANEL
========================================= */

function showCreatePanel() {

    createProfilePanel.classList.remove(
        "hidden"
    );

    profileCard.classList.add(
        "hidden"
    );

    profileFormPanel.classList.add(
        "hidden"
    );

}


/* =========================================
   SHOW PROFILE
========================================= */

function showProfile(
    data
) {

    createProfilePanel.classList.add(
        "hidden"
    );

    profileFormPanel.classList.add(
        "hidden"
    );

    profileCard.classList.remove(
        "hidden"
    );


    document.getElementById(
        "displayName"
    ).textContent =
        data.ingameName || "-";


    document.getElementById(
        "displayIngameName"
    ).textContent =
        data.ingameName || "-";


    document.getElementById(
        "displayFullName"
    ).textContent =
        data.fullName || "-";


    document.getElementById(
        "displayUid"
    ).textContent =
        data.ffUid || "-";


    document.getElementById(
        "displayWhatsapp"
    ).textContent =
        maskWhatsapp(
            data.whatsapp
        );


    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );


    if (
        data.avatarUrl
    ) {

        profileAvatar.src =
            data.avatarUrl;

    }


    /* EDIT FIELDS */

    document.getElementById(
        "fullName"
    ).value =
        data.fullName || "";


    document.getElementById(
        "ingameName"
    ).value =
        data.ingameName || "";


    document.getElementById(
        "ffUid"
    ).value =
        data.ffUid || "";


    document.getElementById(
        "whatsapp"
    ).value =
        data.whatsapp || "";


    /* EDIT AVATAR PREVIEW */

    if (
        data.avatarUrl
    ) {

        avatarPreview.src =
            data.avatarUrl;

        avatarPreview.style.display =
            "block";

        avatarPlaceholder.style.display =
            "none";

    }

}


/* =========================================
   WHATSAPP MASK
========================================= */

function maskWhatsapp(
    number
) {

    if (
        !number
    ) {

        return "PRIVATE";
    }


    if (
        number.length < 7
    ) {

        return "PRIVATE";
    }


    return (
        number.slice(0, 3) +
        "*****" +
        number.slice(-2)
    );

}


/* =========================================
   CREATE PROFILE
========================================= */

startCreateBtn.addEventListener(
    "click",
    function () {

        createProfilePanel.classList.add(
            "hidden"
        );

        profileFormPanel.classList.remove(
            "hidden"
        );

        profileCard.classList.add(
            "hidden"
        );


        clearStatus();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


/* =========================================
   CLOSE FORM
========================================= */

closeFormBtn.addEventListener(
    "click",
    async function () {

        await loadProfile();

    }
);


/* =========================================
   EDIT
========================================= */

editProfileBtn.addEventListener(
    "click",
    function () {

        profileCard.classList.add(
            "hidden"
        );

        profileFormPanel.classList.remove(
            "hidden"
        );

        createProfilePanel.classList.add(
            "hidden"
        );


        clearStatus();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


/* =========================================
   IMAGE PREVIEW
========================================= */

avatarInput.addEventListener(
    "change",
    function () {

        const file =
            avatarInput.files[0];


        if (!file) {

            return;
        }


        if (
            !file.type.startsWith("image/")
        ) {

            showStatus(
                "PLEASE SELECT AN IMAGE FILE.",
                true
            );

            avatarInput.value = "";

            return;
        }


        if (
            file.size > 5 * 1024 * 1024
        ) {

            showStatus(
                "IMAGE MUST BE SMALLER THAN 5MB.",
                true
            );

            avatarInput.value = "";

            return;
        }


        const reader =
            new FileReader();


        reader.onload =
            function () {

                avatarPreview.src =
                    reader.result;

                avatarPreview.style.display =
                    "block";

                avatarPlaceholder.style.display =
                    "none";

            };


        reader.readAsDataURL(file);

    }
);


/* =========================================
   SAVE PROFILE
========================================= */

profileForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (!currentUser) {

            return;
        }


        const fullName =
            document.getElementById(
                "fullName"
            ).value.trim();


        const ingameName =
            document.getElementById(
                "ingameName"
            ).value.trim();


        const ffUid =
            document.getElementById(
                "ffUid"
            ).value.trim();


        const whatsapp =
            document.getElementById(
                "whatsapp"
            ).value.trim();


        if (
            !fullName ||
            !ingameName ||
            !ffUid ||
            !whatsapp
        ) {

            showStatus(
                "PLEASE COMPLETE ALL FIELDS.",
                true
            );

            return;
        }


        saveProfileBtn.disabled =
            true;


        saveProfileBtn.textContent =
            "UPLOADING PROFILE...";


        try {

            let avatarUrl =
                existingAvatarUrl;


            /* =====================================
               UPLOAD AVATAR TO CLOUDINARY
            ===================================== */

            const file =
                avatarInput.files[0];


            if (file) {

                const formData =
                    new FormData();


                formData.append(
                    "file",
                    file
                );


                formData.append(
                    "upload_preset",
                    UPLOAD_PRESET
                );


                const response =
                    await fetch(
                        CLOUDINARY_UPLOAD_URL,
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                const result =
                    await response.json();


                if (
                    !response.ok
                ) {

                    throw new Error(
                        result.error?.message ||
                        "Cloudinary upload failed."
                    );

                }


                avatarUrl =
                    result.secure_url;

            }


            saveProfileBtn.textContent =
                "SAVING PROFILE...";


            /* =====================================
               SAVE TO FIRESTORE
            ===================================== */

            await setDoc(
                doc(
                    db,
                    "profiles",
                    currentUser.uid
                ),
                {

                    userId:
                        currentUser.uid,

                    email:
                        currentUser.email || "",

                    fullName:
                        fullName,

                    ingameName:
                        ingameName,

                    ffUid:
                        ffUid,

                    whatsapp:
                        whatsapp,

                    avatarUrl:
                        avatarUrl,

                    updatedAt:
                        serverTimestamp()

                },
                {
                    merge: true
                }
            );


            existingAvatarUrl =
                avatarUrl;


            showStatus(
                "PROFILE SAVED SUCCESSFULLY ✓",
                false
            );


            await loadProfile();

        }

        catch (error) {

            console.error(
                "PROFILE SAVE ERROR:",
                error
            );


            showStatus(
                "PROFILE SAVE FAILED: " +
                error.message,
                true
            );

        }


        saveProfileBtn.disabled =
            false;


        saveProfileBtn.textContent =
            "SAVE PLAYER PROFILE";

    }
);


/* =========================================
   STATUS
========================================= */

function showStatus(
    text,
    isError = false
) {

    formStatus.textContent =
        text;

    formStatus.style.color =
        isError
            ? "#ff5f6d"
            : "#28e7ff";

}


function clearStatus() {

    formStatus.textContent =
        "";

}
