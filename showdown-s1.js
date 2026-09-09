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
    query,
    where,
    getDocs,
    doc,
    runTransaction,
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
   TOURNAMENT SETTINGS
========================================= */

const TOURNAMENT_ID =
    "battle-arena-showdown-s1";


const TOTAL_SLOTS =
    256;


const GROUP_COUNT =
    21;


const GROUP_CAPACITY =
    12;


const GROUPED_SLOTS =
    GROUP_COUNT * GROUP_CAPACITY;


const RESERVE_COUNT =
    TOTAL_SLOTS - GROUPED_SLOTS;



/* =========================================
   ELEMENTS
========================================= */

const registerButton =
    document.getElementById(
        "registerTournamentBtn"
    );


const registrationStatus =
    document.getElementById(
        "registrationStatus"
    );


const eligibilityTitle =
    document.getElementById(
        "eligibilityTitle"
    );


const eligibilityMessage =
    document.getElementById(
        "eligibilityMessage"
    );


const resultBox =
    document.getElementById(
        "registrationResult"
    );


const registeredTeamName =
    document.getElementById(
        "registeredTeamName"
    );


const registeredGroupName =
    document.getElementById(
        "registeredGroupName"
    );


const registeredSlot =
    document.getElementById(
        "registeredSlot"
    );



/* =========================================
   STATE
========================================= */

let currentUser =
    null;


let currentTeam =
    null;


let currentMembership =
    null;



/* =========================================
   HELPERS
========================================= */

function setStatus(
    message,
    type = ""
) {

    registrationStatus.textContent =
        message;

    registrationStatus.className =
        `registration-status ${type}`.trim();
}



function setEligibility(
    title,
    message,
    color = ""
) {

    eligibilityTitle.textContent =
        title;

    eligibilityMessage.textContent =
        message;

    eligibilityTitle.style.color =
        color;
}



function groupName(
    index
) {

    return `GROUP ${String.fromCharCode(65 + index)}`;
}



function groupDocumentId(
    index
) {

    return `${TOURNAMENT_ID}_group_${index}`;
}



function reserveDocumentId(
    number
) {

    return `${TOURNAMENT_ID}_reserve_${number}`;
}



function formatSlot(
    value
) {

    return String(value)
        .padStart(2, "0");
}



/* =========================================
   LOAD CURRENT USER TEAM
========================================= */

async function loadCurrentTeam(
    user
) {

    const memberQuery =
        query(
            collection(
                db,
                "team_members"
            ),
            where(
                "playerId",
                "==",
                user.uid
            )
        );


    const memberSnapshot =
        await getDocs(
            memberQuery
        );



    if (
        memberSnapshot.empty
    ) {

        currentTeam =
            null;

        currentMembership =
            null;


        setEligibility(
            "NO TEAM FOUND",
            "Create or join a team before registering for Battle Arena Showdown Season 1.",
            "#ff5877"
        );


        registerButton.disabled =
            true;

        return;
    }



    const memberDoc =
        memberSnapshot.docs[0];


    const membership =
        memberDoc.data();


    currentMembership = {

        id:
            memberDoc.id,

        ...membership

    };



    if (
        !membership.teamId
    ) {

        setEligibility(
            "TEAM ERROR",
            "Your team membership record is incomplete.",
            "#ff5877"
        );


        registerButton.disabled =
            true;

        return;
    }



    const teamReference =
        doc(
            db,
            "teams",
            membership.teamId
        );


    const teamSnapshot =
        await getDocs(
            query(
                collection(
                    db,
                    "teams"
                ),
                where(
                    "__name__",
                    "==",
                    membership.teamId
                )
            )
        );



    if (
        teamSnapshot.empty
    ) {

        setEligibility(
            "TEAM NOT FOUND",
            "Your team record could not be found.",
            "#ff5877"
        );


        registerButton.disabled =
            true;

        return;
    }



    const teamDoc =
        teamSnapshot.docs[0];


    currentTeam = {

        id:
            teamDoc.id,

        ...teamDoc.data()

    };



    /* =====================================
       CAPTAIN CHECK
    ====================================== */

    if (
        currentTeam.captainId !==
        user.uid
        ||
        membership.role !==
        "captain"
    ) {

        setEligibility(
            "CAPTAIN ONLY",
            "Only your team captain can register this team for the tournament.",
            "#ffc857"
        );


        registerButton.disabled =
            true;

        return;
    }



    /* =====================================
       REAL ROSTER COUNT
    ====================================== */

    const rosterQuery =
        query(
            collection(
                db,
                "team_members"
            ),
            where(
                "teamId",
                "==",
                currentTeam.id
            )
        );


    const rosterSnapshot =
        await getDocs(
            rosterQuery
        );


    const playerCount =
        rosterSnapshot.size;



    if (
        playerCount < 4
    ) {

        setEligibility(
            "TEAM NOT ELIGIBLE",
            `Your team has ${playerCount} player${playerCount === 1 ? "" : "s"}. At least 4 players are required.`,
            "#ff5877"
        );


        registerButton.disabled =
            true;

        return;
    }



    if (
        playerCount > 8
    ) {

        setEligibility(
            "TEAM SIZE INVALID",
            "Your team exceeds the maximum allowed roster size of 8 players.",
            "#ff5877"
        );


        registerButton.disabled =
            true;

        return;
    }



    /* =====================================
       EXISTING REGISTRATION CHECK
    ====================================== */

    const registrationReference =
        doc(
            db,
            "tournament_registrations",
            `${TOURNAMENT_ID}_${currentTeam.id}`
        );


    const registrationSnapshot =
        await runTransaction(
            db,
            async transaction => {

                return await transaction.get(
                    registrationReference
                );

            }
        );



    if (
        registrationSnapshot.exists()
    ) {

        const registration =
            registrationSnapshot.data();


        showRegisteredResult(
            registration,
            currentTeam.teamName ||
                "YOUR TEAM"
        );


        setEligibility(
            "ALREADY REGISTERED",
            "Your team is already registered for this tournament.",
            "#00ffb3"
        );


        setStatus(
            `REGISTERED — ${registration.groupName || "SLOT CONFIRMED"}`,
            "success"
        );


        registerButton.textContent =
            "REGISTERED ✓";


        registerButton.disabled =
            true;

        return;
    }



    /* =====================================
       READY
    ====================================== */

    setEligibility(
        "TEAM ELIGIBLE",
        `${currentTeam.teamName || "Your team"} is eligible. Captain registration is ready.`,
        "#00ffb3"
    );


    registerButton.disabled =
        false;
}



/* =========================================
   REGISTER TOURNAMENT
========================================= */

async function registerTournament() {

    if (
        !currentUser
    ) {

        setStatus(
            "PLEASE LOGIN FIRST.",
            "error"
        );

        return;
    }



    if (
        !currentTeam
        ||
        currentTeam.captainId !==
        currentUser.uid
    ) {

        setStatus(
            "ONLY THE TEAM CAPTAIN CAN REGISTER.",
            "error"
        );

        return;
    }



    const teamId =
        currentTeam.id;


    const registrationId =
        `${TOURNAMENT_ID}_${teamId}`;


    const registrationReference =
        doc(
            db,
            "tournament_registrations",
            registrationId
        );


    registerButton.disabled =
        true;


    registerButton.textContent =
        "SECURING SLOT...";


    setStatus(
        "VERIFYING TEAM AND FINDING NEXT AVAILABLE SLOT...",
        ""
    );



    try {

        const registration =
            await runTransaction(
                db,
                async transaction => {


                    /* =================================
                       ALL READS FIRST
                    ================================= */

                    const registrationSnapshot =
                        await transaction.get(
                            registrationReference
                        );


                    if (
                        registrationSnapshot.exists()
                    ) {

                        return {

                            ...registrationSnapshot.data(),

                            reused:
                                true

                        };
                    }



                    const teamReference =
                        doc(
                            db,
                            "teams",
                            teamId
                        );


                    const teamSnapshot =
                        await transaction.get(
                            teamReference
                        );


                    if (
                        !teamSnapshot.exists()
                    ) {

                        throw new Error(
                            "TEAM NO LONGER EXISTS."
                        );
                    }



                    const team =
                        teamSnapshot.data();



                    if (
                        team.captainId !==
                        currentUser.uid
                    ) {

                        throw new Error(
                            "ONLY THE TEAM CAPTAIN CAN REGISTER."
                        );
                    }



                    /* =================================
                       GROUP DOCS
                    ================================= */

                    const groupReferences =
                        [];


                    for (
                        let i = 0;
                        i < GROUP_COUNT;
                        i++
                    ) {

                        groupReferences.push(
                            doc(
                                db,
                                "tournament_groups",
                                groupDocumentId(i)
                            )
                        );

                    }



                    const groupSnapshots =
                        [];


                    for (
                        const groupReference
                        of groupReferences
                    ) {

                        groupSnapshots.push(
                            await transaction.get(
                                groupReference
                            )
                        );

                    }



                    /* =================================
                       RESERVE DOCS
                    ================================= */

                    const reserveReferences =
                        [];


                    for (
                        let i = 1;
                        i <= RESERVE_COUNT;
                        i++
                    ) {

                        reserveReferences.push(
                            doc(
                                db,
                                "tournament_groups",
                                reserveDocumentId(i)
                            )
                        );

                    }



                    const reserveSnapshots =
                        [];


                    for (
                        const reserveReference
                        of reserveReferences
                    ) {

                        reserveSnapshots.push(
                            await transaction.get(
                                reserveReference
                            )
                        );

                    }



                    /* =================================
                       FIND GROUP
                    ================================= */

                    let selectedGroup =
                        null;


                    for (
                        let i = 0;
                        i < GROUP_COUNT;
                        i++
                    ) {

                        const snapshot =
                            groupSnapshots[i];


                        const data =
                            snapshot.exists()
                                ? snapshot.data()
                                : {};


                        const teamCount =
                            Number(
                                data.teamCount ||
                                0
                            );



                        if (
                            teamCount <
                            GROUP_CAPACITY
                        ) {

                            selectedGroup = {

                                reference:
                                    groupReferences[i],

                                name:
                                    groupName(i),

                                teamCount,

                                slotNumber:
                                    teamCount + 1

                            };


                            break;
                        }

                    }



                    /* =================================
                       RESERVE SLOT
                    ================================= */

                    let selectedReserve =
                        null;


                    if (
                        !selectedGroup
                    ) {

                        for (
                            let i = 0;
                            i < RESERVE_COUNT;
                            i++
                        ) {

                            const snapshot =
                                reserveSnapshots[i];


                            if (
                                !snapshot.exists()
                            ) {

                                selectedReserve = {

                                    reference:
                                        reserveReferences[i],

                                    number:
                                        i + 1

                                };


                                break;
                            }

                        }

                    }



                    if (
                        !selectedGroup
                        &&
                        !selectedReserve
                    ) {

                        throw new Error(
                            "TOURNAMENT SLOTS ARE FULL."
                        );
                    }



                    /* =================================
                       DOUBLE SLOT VALIDATION
                    ================================= */

                    const calculatedSlot =
                        selectedGroup

                            ? selectedGroup.slotNumber

                            : GROUPED_SLOTS +
                              selectedReserve.number;



                    if (
                        calculatedSlot >
                        TOTAL_SLOTS
                    ) {

                        throw new Error(
                            "TOURNAMENT SLOTS ARE FULL."
                        );
                    }



                    /* =================================
                       REGISTRATION DATA
                    ================================= */

                    const registrationData = {

                        tournamentId:
                            TOURNAMENT_ID,

                        teamId:
                            teamId,

                        captainId:
                            currentUser.uid,

                        teamName:
                            team.teamName ||
                            "",

                        teamTag:
                            team.teamTag ||
                            "",

                        teamLogo:
                            team.teamLogo ||
                            "",

                        groupName:
                            selectedGroup
                                ? selectedGroup.name
                                : `RESERVE SLOT ${formatSlot(
                                      selectedReserve.number
                                  )}`,

                        slotNumber:
                            calculatedSlot,

                        status:
                            "registered",

                        createdAt:
                            serverTimestamp()

                    };



                    /* =================================
                       GROUP WRITE
                    ================================= */

                    if (
                        selectedGroup
                    ) {

                        transaction.set(

                            selectedGroup.reference,

                            {

                                tournamentId:
                                    TOURNAMENT_ID,

                                groupName:
                                    selectedGroup.name,

                                teamCount:
                                    selectedGroup.teamCount + 1,

                                capacity:
                                    GROUP_CAPACITY,

                                updatedAt:
                                    serverTimestamp()

                            },

                            {
                                merge: true
                            }

                        );

                    }



                    /* =================================
                       RESERVE WRITE
                    ================================= */

                    if (
                        selectedReserve
                    ) {

                        transaction.set(

                            selectedReserve.reference,

                            {

                                tournamentId:
                                    TOURNAMENT_ID,

                                type:
                                    "reserve",

                                reserveNumber:
                                    selectedReserve.number,

                                slotNumber:
                                    calculatedSlot,

                                teamId:
                                    teamId,

                                teamName:
                                    team.teamName ||
                                    "",

                                status:
                                    "registered",

                                updatedAt:
                                    serverTimestamp()

                            }

                        );

                    }



                    /* =================================
                       REGISTRATION WRITE
                    ================================= */

                    transaction.set(

                        registrationReference,

                        registrationData

                    );



                    return registrationData;

                }
            );



        /* =========================================
           SUCCESS
        ========================================= */

        showRegisteredResult(
            registration,
            currentTeam.teamName ||
            "YOUR TEAM"
        );


        setEligibility(
            "REGISTRATION CONFIRMED",
            "Your team has successfully entered Battle Arena Showdown Season 1.",
            "#00ffb3"
        );


        setStatus(
            registration.reused
                ? "YOUR TEAM WAS ALREADY REGISTERED."
                : "REGISTRATION SUCCESSFUL ✓",
            "success"
        );


        registerButton.textContent =
            "REGISTERED ✓";


        registerButton.disabled =
            true;


    }
    catch (
        error
    ) {

        console.error(
            "SHOWDOWN REGISTRATION ERROR:",
            error
        );


        setStatus(
            error.message ||
            "UNABLE TO COMPLETE REGISTRATION.",
            "error"
        );


        registerButton.textContent =
            "REGISTER NOW";


        registerButton.disabled =
            false;

    }

}



/* =========================================
   SHOW RESULT
========================================= */

function showRegisteredResult(
    registration,
    fallbackTeamName
) {

    registeredTeamName.textContent =
        registration.teamName ||
        fallbackTeamName;


    registeredGroupName.textContent =
        registration.groupName ||
        "-";


    registeredSlot.textContent =
        registration.slotNumber
            ? formatSlot(
                registration.slotNumber
              )
            : "-";


    resultBox.classList.remove(
        "hidden"
    );

}



/* =========================================
   BUTTON
========================================= */

registerButton.addEventListener(
    "click",
    registerTournament
);



/* =========================================
   AUTH
========================================= */

onAuthStateChanged(
    auth,
    async user => {

        currentUser =
            user;



        if (
            !user
        ) {

            setEligibility(
                "LOGIN REQUIRED",
                "Login to Battle Arena first. Only an eligible team captain can register.",
                "#ffc857"
            );


            registerButton.disabled =
                true;


            return;
        }



        registerButton.disabled =
            true;



        try {

            await loadCurrentTeam(
                user
            );

        }
        catch (
            error
        ) {

            console.error(
                "TEAM VERIFICATION ERROR:",
                error
            );


            setEligibility(
                "VERIFICATION FAILED",
                "Please refresh the page and try again.",
                "#ff5877"
            );


            setStatus(
                "TEAM VERIFICATION FAILED.",
                "error"
            );


            registerButton.disabled =
                true;

        }

    }
);
