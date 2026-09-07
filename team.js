import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


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

const CLOUDINARY_URL =
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;


/* =========================================
   ELEMENTS
========================================= */

const teamCenter =
    document.getElementById("teamCenter");

const createTeamPanel =
    document.getElementById("createTeamPanel");

const myTeamPanel =
    document.getElementById("myTeamPanel");

const createTeamBtn =
    document.getElementById("createTeamBtn");

const joinTeamBtn =
    document.getElementById("joinTeamBtn");

const closeCreateBtn =
    document.getElementById("closeCreateBtn");

const teamForm =
    document.getElementById("teamForm");

const teamLogoInput =
    document.getElementById("teamLogoInput");

const logoImage =
    document.getElementById("logoImage");

const logoPlaceholder =
    document.getElementById("logoPlaceholder");

const teamStatus =
    document.getElementById("teamStatus");

const saveTeamBtn =
    document.getElementById("saveTeamBtn");

const leaveTeamBtn =
    document.getElementById("leaveTeamBtn");

const disbandTeamBtn =
    document.getElementById("disbandTeamBtn");

const joinTeamPanel =
    document.getElementById(
        "joinTeamPanel"
    );

const closeJoinBtn =
    document.getElementById(
        "closeJoinBtn"
    );

const teamSearchInput =
    document.getElementById(
        "teamSearchInput"
    );

const registeredTeams =
    document.getElementById(
        "registeredTeams"
    );

const joinStatus =
    document.getElementById(
        "joinStatus"
    );
/* =========================================
   STATE
========================================= */

let currentUser = null;

let currentTeam = null;

let currentMembershipId = null;


/* =========================================
   AUTH
========================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "index.html";

            return;
        }

        currentUser =
            user;

        await findExistingTeam();

    }
);


/* =========================================
   FIND EXISTING TEAM
========================================= */

async function findExistingTeam() {

    try {

        const membershipQuery =
            query(
                collection(
                    db,
                    "team_members"
                ),
                where(
                    "playerId",
                    "==",
                    currentUser.uid
                )
            );


        const membershipSnapshot =
            await getDocs(
                membershipQuery
            );


        if (
            membershipSnapshot.empty
        ) {

            showTeamCenter();

            return;
        }


        const membershipDoc =
            membershipSnapshot.docs[0];

        currentMembershipId =
            membershipDoc.id;


        const membership =
            membershipDoc.data();


        const teamRef =
            doc(
                db,
                "teams",
                membership.teamId
            );


        const teamSnapshot =
            await getDoc(
                teamRef
            );


        if (
            !teamSnapshot.exists()
        ) {

            showTeamCenter();

            return;
        }


        currentTeam = {

            id:
                teamSnapshot.id,

            ...teamSnapshot.data()

        };


        await showMyTeam();

    }

    catch (error) {

        console.error(
            "TEAM LOAD ERROR:",
            error
        );

        showTeamStatus(
            "UNABLE TO LOAD TEAM.",
            true
        );

    }

}


/* =========================================
   SHOW TEAM CENTER
========================================= */

function showTeamCenter() {

    teamCenter.classList.remove(
        "hidden"
    );

    createTeamPanel.classList.add(
        "hidden"
    );

    myTeamPanel.classList.add(
        "hidden"
    );

}


/* =========================================
   CREATE TEAM BUTTON
========================================= */

createTeamBtn.addEventListener(
    "click",
    () => {

        teamCenter.classList.add(
            "hidden"
        );

        myTeamPanel.classList.add(
            "hidden"
        );

        createTeamPanel.classList.remove(
            "hidden"
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


/* =========================================
   CLOSE CREATE
========================================= */

closeCreateBtn.addEventListener(
    "click",
    () => {

        showTeamCenter();

    }
);


/* =========================================
   JOIN BUTTON
========================================= */

joinTeamBtn.addEventListener(
    "click",
    async () => {

        teamCenter.classList.add(
            "hidden"
        );

        createTeamPanel.classList.add(
            "hidden"
        );

        myTeamPanel.classList.add(
            "hidden"
        );

        joinTeamPanel.classList.remove(
            "hidden"
        );

        await loadRegisteredTeams();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);

/* =========================================
   LOGO PREVIEW
========================================= */

teamLogoInput.addEventListener(
    "change",
    () => {

        const file =
            teamLogoInput.files[0];


        if (!file) {
            return;
        }


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            showTeamStatus(
                "PLEASE SELECT AN IMAGE FILE.",
                true
            );

            teamLogoInput.value = "";

            return;
        }


        if (
            file.size >
            5 * 1024 * 1024
        ) {

            showTeamStatus(
                "TEAM LOGO MUST BE UNDER 5MB.",
                true
            );

            teamLogoInput.value = "";

            return;
        }


        const reader =
            new FileReader();


        reader.onload =
            () => {

                logoImage.src =
                    reader.result;

                logoImage.style.display =
                    "block";

                logoPlaceholder.style.display =
                    "none";

            };


        reader.readAsDataURL(
            file
        );

    }
);


/* =========================================
   CREATE TEAM
========================================= */

teamForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (!currentUser) {
            return;
        }


        const teamName =
            document.getElementById(
                "teamName"
            ).value.trim();


        const teamTag =
            document.getElementById(
                "teamTag"
            ).value.trim()
            .toUpperCase();


        const captainName =
            document.getElementById(
                "captainName"
            ).value.trim();


        const captainWhatsapp =
            document.getElementById(
                "captainWhatsapp"
            ).value.trim();


        const teamMotive =
            document.getElementById(
                "teamMotive"
            ).value.trim();


        if (
            !teamName ||
            !teamTag ||
            !captainName ||
            !captainWhatsapp ||
            !teamMotive
        ) {

            showTeamStatus(
                "PLEASE COMPLETE ALL TEAM INFORMATION.",
                true
            );

            return;
        }


        saveTeamBtn.disabled =
            true;

        saveTeamBtn.textContent =
            "CREATING TEAM...";


        try {

            /* =====================================
               CHECK ALREADY MEMBER
            ===================================== */

            const existingMembershipQuery =
                query(
                    collection(
                        db,
                        "team_members"
                    ),
                    where(
                        "playerId",
                        "==",
                        currentUser.uid
                    )
                );


            const existingMembership =
                await getDocs(
                    existingMembershipQuery
                );


            if (
                !existingMembership.empty
            ) {

                throw new Error(
                    "YOU ARE ALREADY A MEMBER OF A TEAM."
                );

            }


            /* =====================================
               UPLOAD TEAM LOGO
            ===================================== */

            const file =
                teamLogoInput.files[0];


            if (!file) {

                throw new Error(
                    "PLEASE UPLOAD A TEAM LOGO."
                );

            }


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


            const uploadResponse =
                await fetch(
                    CLOUDINARY_URL,
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const uploadResult =
                await uploadResponse.json();


            if (
                !uploadResponse.ok
            ) {

                throw new Error(
                    uploadResult.error?.message ||
                    "TEAM LOGO UPLOAD FAILED."
                );

            }


            const teamLogoUrl =
                uploadResult.secure_url;


            /* =====================================
               CREATE TEAM DOCUMENT
            ===================================== */

            const teamReference =
                await addDoc(
                    collection(
                        db,
                        "teams"
                    ),
                    {

                        teamName,

                        teamTag,

                        teamLogo:
                            teamLogoUrl,

                        captainId:
                            currentUser.uid,

                        captainName,

                        captainWhatsapp,

                        motive:
                            teamMotive,

                        playerCount:
                            1,

                        tournamentEligible:
                            false,

                        createdAt:
                            serverTimestamp()

                    }
                );


            /* =====================================
               CAPTAIN MEMBERSHIP
            ===================================== */

            const membershipReference =
                await addDoc(
                    collection(
                        db,
                        "team_members"
                    ),
                    {

                        teamId:
                            teamReference.id,

                        playerId:
                            currentUser.uid,

                        playerName:
                            captainName,

                        role:
                            "captain",

                        joinedAt:
                            serverTimestamp()

                    }
                );


            currentMembershipId =
                membershipReference.id;


            currentTeam = {

                id:
                    teamReference.id,

                teamName,

                teamTag,

                teamLogo:
                    teamLogoUrl,

                captainId:
                    currentUser.uid,

                captainName,

                captainWhatsapp,

                motive:
                    teamMotive,

                playerCount:
                    1,

                tournamentEligible:
                    false

            };


            teamForm.reset();


            logoImage.src = "";

            logoImage.style.display =
                "none";

            logoPlaceholder.style.display =
                "block";


            showTeamStatus(
                "TEAM CREATED SUCCESSFULLY ✓",
                false
            );


            await showMyTeam();

        }

        catch (error) {

            console.error(
                "CREATE TEAM ERROR:",
                error
            );


            showTeamStatus(
                error.message ||
                "UNABLE TO CREATE TEAM.",
                true
            );

        }


        saveTeamBtn.disabled =
            false;

        saveTeamBtn.textContent =
            "CREATE TEAM";

    }
);


/* =========================================
   SHOW MY TEAM
========================================= */

async function showMyTeam() {

    teamCenter.classList.add(
        "hidden"
    );

    createTeamPanel.classList.add(
        "hidden"
    );

    myTeamPanel.classList.remove(
        "hidden"
    );


    document.getElementById(
        "myTeamName"
    ).textContent =
        currentTeam.teamName || "-";


    document.getElementById(
        "myTeamTag"
    ).textContent =
        currentTeam.teamTag || "-";


    document.getElementById(
        "myCaptainName"
    ).textContent =
        currentTeam.captainName || "-";


    document.getElementById(
        "myTeamMotive"
    ).textContent =
        currentTeam.motive || "-";


    document.getElementById(
        "myPlayerCount"
    ).textContent =
        currentTeam.playerCount || 1;


    const teamLogo =
        document.getElementById(
            "myTeamLogoImage"
        );


    if (
        currentTeam.teamLogo
    ) {

        teamLogo.src =
            currentTeam.teamLogo;

    }


    const eligibility =
        document.getElementById(
            "myTeamEligibility"
        );


    if (
        Number(
            currentTeam.playerCount || 1
        ) >= 4
    ) {

        eligibility.textContent =
            "TOURNAMENT READY";

        eligibility.className =
            "status-ready";

    }

    else {

        eligibility.textContent =
            "WAITING FOR PLAYERS";

        eligibility.className =
            "status-pending";

    }


    /* Captain gets DISBAND */

    if (
        currentTeam.captainId ===
        currentUser.uid
    ) {

        leaveTeamBtn.classList.add(
            "hidden"
        );

        disbandTeamBtn.classList.remove(
            "hidden"
        );

    }

    else {

        leaveTeamBtn.classList.remove(
            "hidden"
        );

        disbandTeamBtn.classList.add(
            "hidden"
        );

    }

}


/* =========================================
   LEAVE TEAM
========================================= */

leaveTeamBtn.addEventListener(
    "click",
    async () => {

        if (
            !currentMembershipId
        ) {
            return;
        }


        const confirmed =
            confirm(
                "Are you sure you want to leave this team?"
            );


        if (!confirmed) {
            return;
        }


        try {

            await deleteDoc(
                doc(
                    db,
                    "team_members",
                    currentMembershipId
                )
            );


            window.location.reload();

        }

        catch (error) {

            console.error(
                "LEAVE TEAM ERROR:",
                error
            );

            alert(
                "Unable to leave the team."
            );

        }

    }
);


/* =========================================
   DISBAND TEAM
========================================= */

disbandTeamBtn.addEventListener(
    "click",
    async () => {

        if (
            !currentTeam?.id
        ) {
            return;
        }


        const confirmed =
            confirm(
                "Disband this team? This cannot be undone."
            );


        if (!confirmed) {
            return;
        }


        try {

            /* Delete current captain membership */

            if (
                currentMembershipId
            ) {

                await deleteDoc(
                    doc(
                        db,
                        "team_members",
                        currentMembershipId
                    )
                );

            }


            /* Delete team */

            await deleteDoc(
                doc(
                    db,
                    "teams",
                    currentTeam.id
                )
            );


            window.location.reload();

        }

        catch (error) {

            console.error(
                "DISBAND TEAM ERROR:",
                error
            );

            alert(
                "Unable to disband team."
            );

        }

    }
);


/* =========================================
   STATUS
========================================= */

function showTeamStatus(
    message,
    error = false
) {

    teamStatus.textContent =
        message;

    teamStatus.style.color =
        error
            ? "#ff5364"
            : "#28e7ff";

}
