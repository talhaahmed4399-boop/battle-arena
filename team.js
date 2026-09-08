import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

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
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


/* =========================================
   FIREBASE CONFIG
========================================= */

const firebaseConfig = {
    apiKey: "AIzaSyAX5v1-Fq-ujlFdxI_K-nqOq7RnI_xDFMw",
    authDomain: "battle-arena-64da6.firebaseapp.com",
    projectId: "battle-arena-64da6",
    storageBucket: "battle-arena-64da6.firebasestorage.app",
    messagingSenderId: "17903384440",
    appId: "1:17903384440:web:05998e4b7187752891ba8d",
    measurementId: "G-QBP2VD2GGX"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================
   CLOUDINARY
========================================= */

const CLOUDINARY_URL =
    "https://api.cloudinary.com/v1_1/p6502iog/image/upload";

const UPLOAD_PRESET =
    "battle_arena_profiles";


/* =========================================
   STATE
========================================= */

let currentUser = null;
let currentTeam = null;
let currentMembershipId = null;

let registeredTeamsData = [];


/* =========================================
   HELPERS
========================================= */

function getElement(id) {
    return document.getElementById(id);
}


function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}


function setTeamStatus(message, error = false) {

    const status = getElement("teamStatus");

    if (!status) {
        return;
    }

    status.textContent = message;

    status.style.color =
        error
            ? "#ff5364"
            : "#28e7ff";
}


/* =========================================
   PANEL MANAGEMENT
========================================= */

function showTeamCenter() {

    getElement("teamCenter")?.classList.remove("hidden");

    getElement("createTeamPanel")?.classList.add("hidden");

    getElement("joinTeamPanel")?.classList.add("hidden");

    getElement("myTeamPanel")?.classList.add("hidden");
}


function showCreateTeamPanel() {

    if (!currentUser) {

        alert("PLEASE LOGIN FIRST.");

        return;
    }

    getElement("teamCenter")?.classList.add("hidden");

    getElement("joinTeamPanel")?.classList.add("hidden");

    getElement("myTeamPanel")?.classList.add("hidden");

    getElement("createTeamPanel")?.classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


async function showJoinTeamPanel() {

    if (!currentUser) {

        alert("PLEASE LOGIN FIRST.");

        return;
    }

    getElement("teamCenter")?.classList.add("hidden");

    getElement("createTeamPanel")?.classList.add("hidden");

    getElement("myTeamPanel")?.classList.add("hidden");

    getElement("joinTeamPanel")?.classList.remove("hidden");

    await loadRegisteredTeams();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================
   FIND EXISTING TEAM
========================================= */

async function findExistingTeam() {

    try {

        const membershipQuery = query(
            collection(db, "team_members"),
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


        if (membershipSnapshot.empty) {

            currentTeam = null;

            currentMembershipId = null;

            showTeamCenter();

            return;
        }


        const membershipDoc =
            membershipSnapshot.docs[0];

        const membership =
            membershipDoc.data();


        currentMembershipId =
            membershipDoc.id;


        if (!membership.teamId) {

            currentTeam = null;

            showTeamCenter();

            return;
        }


        const teamSnapshot =
            await getDoc(
                doc(
                    db,
                    "teams",
                    membership.teamId
                )
            );


        if (!teamSnapshot.exists()) {

            currentTeam = null;

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

        currentTeam = null;

        currentMembershipId = null;

        showTeamCenter();
    }
}


/* =========================================
   CREATE TEAM
========================================= */

async function handleCreateTeam(event) {

    event.preventDefault();


    if (!currentUser) {

        setTeamStatus(
            "PLEASE LOGIN FIRST.",
            true
        );

        return;
    }


    const teamName =
        getElement("teamName")?.value.trim() ||
        "";


    const teamTag =
        getElement("teamTag")?.value
            .trim()
            .toUpperCase() ||
        "";


    const captainName =
        getElement("captainName")?.value.trim() ||
        "";


    const captainWhatsapp =
        getElement("captainWhatsapp")?.value.trim() ||
        "";


    const teamMotive =
        getElement("teamMotive")?.value.trim() ||
        "";


    const logoFile =
        getElement("teamLogoInput")?.files?.[0];


    if (
        !teamName ||
        !teamTag ||
        !captainName ||
        !captainWhatsapp ||
        !teamMotive
    ) {

        setTeamStatus(
            "PLEASE COMPLETE ALL TEAM INFORMATION.",
            true
        );

        return;
    }


    if (!logoFile) {

        setTeamStatus(
            "PLEASE UPLOAD A TEAM LOGO.",
            true
        );

        return;
    }


    if (
        !logoFile.type.startsWith("image/")
    ) {

        setTeamStatus(
            "PLEASE SELECT A VALID IMAGE FILE.",
            true
        );

        return;
    }


    if (
        logoFile.size >
        5 * 1024 * 1024
    ) {

        setTeamStatus(
            "TEAM LOGO MUST BE UNDER 5MB.",
            true
        );

        return;
    }


    const saveButton =
        getElement("saveTeamBtn");


    if (saveButton) {

        saveButton.disabled = true;

        saveButton.textContent =
            "CREATING TEAM...";
    }


    try {

        /* CHECK CURRENT TEAM MEMBERSHIP */

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
            !membershipSnapshot.empty
        ) {

            throw new Error(
                "YOU ARE ALREADY A MEMBER OF A TEAM."
            );
        }


        /* CLOUDINARY UPLOAD */

        const formData =
            new FormData();


        formData.append(
            "file",
            logoFile
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
                uploadResult?.error?.message ||
                "TEAM LOGO UPLOAD FAILED."
            );
        }


        /* CREATE TEAM */

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
                        uploadResult.secure_url,

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


        /* CREATE CAPTAIN MEMBERSHIP */

        const memberReference =
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
            memberReference.id;


        currentTeam = {

            id:
                teamReference.id,

            teamName,

            teamTag,

            teamLogo:
                uploadResult.secure_url,

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


        getElement(
            "teamForm"
        )?.reset();


        const logoImage =
            getElement(
                "logoImage"
            );


        const logoPlaceholder =
            getElement(
                "logoPlaceholder"
            );


        if (logoImage) {

            logoImage.src = "";

            logoImage.style.display =
                "none";
        }


        if (logoPlaceholder) {

            logoPlaceholder.style.display =
                "block";
        }


        setTeamStatus(
            "TEAM CREATED SUCCESSFULLY ✓"
        );


        await showMyTeam();

    }

    catch (error) {

        console.error(
            "CREATE TEAM ERROR:",
            error
        );


        setTeamStatus(
            error.message ||
            "UNABLE TO CREATE TEAM.",
            true
        );
    }


    finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "CREATE TEAM";
        }
    }
}


/* =========================================
   SHOW MY TEAM
========================================= */

async function showMyTeam() {

    if (
        !currentTeam ||
        !currentUser
    ) {

        showTeamCenter();

        return;
    }


    getElement(
        "teamCenter"
    )?.classList.add(
        "hidden"
    );


    getElement(
        "createTeamPanel"
    )?.classList.add(
        "hidden"
    );


    getElement(
        "joinTeamPanel"
    )?.classList.add(
        "hidden"
    );


    getElement(
        "myTeamPanel"
    )?.classList.remove(
        "hidden"
    );


    const name =
        getElement(
            "myTeamName"
        );


    const tag =
        getElement(
            "myTeamTag"
        );


    const captain =
        getElement(
            "myCaptainName"
        );


    const motive =
        getElement(
            "myTeamMotive"
        );


    const playerCount =
        getElement(
            "myPlayerCount"
        );


    const logo =
        getElement(
            "myTeamLogoImage"
        );


    if (name) {

        name.textContent =
            currentTeam.teamName ||
            "-";
    }


    if (tag) {

        tag.textContent =
            currentTeam.teamTag ||
            "-";
    }


    if (captain) {

        captain.textContent =
            currentTeam.captainName ||
            "-";
    }


    if (motive) {

        motive.textContent =
            currentTeam.motive ||
            "-";
    }


    if (playerCount) {

        playerCount.textContent =
            currentTeam.playerCount ||
            1;
    }


    if (
        logo &&
        currentTeam.teamLogo
    ) {

        logo.src =
            currentTeam.teamLogo;
    }


    const isCaptain =
        currentTeam.captainId ===
        currentUser.uid;


    if (isCaptain) {

        getElement(
            "leaveTeamBtn"
        )?.classList.add(
            "hidden"
        );


        getElement(
            "disbandTeamBtn"
        )?.classList.remove(
            "hidden"
        );

    }

    else {

        getElement(
            "leaveTeamBtn"
        )?.classList.remove(
            "hidden"
        );


        getElement(
            "disbandTeamBtn"
        )?.classList.add(
            "hidden"
        );


        getElement(
            "teamRequestsSection"
        )?.classList.add(
            "hidden"
        );
    }


    await loadTeamRoster();


    if (isCaptain) {

        await loadCaptainRequests();
    }
}


/* =========================================
   ELIGIBILITY
========================================= */

function updateEligibility(
    count
) {

    const eligibility =
        getElement(
            "myTeamEligibility"
        );


    if (!eligibility) {
        return;
    }


    if (
        Number(count) >= 4
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
}


/* =========================================
   LOAD REGISTERED TEAMS
========================================= */

async function loadRegisteredTeams() {

    const container =
        getElement(
            "registeredTeams"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="teams-loading">
            LOADING TEAMS...
        </div>
    `;


    const status =
        getElement(
            "joinStatus"
        );


    if (status) {

        status.textContent =
            "";
    }


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "teams"
                )
            );


        registeredTeamsData =
            snapshot.docs
                .map(
                    teamDoc => ({

                        id:
                            teamDoc.id,

                        ...teamDoc.data()

                    })
                )
                .sort(
                    (a, b) =>
                        (
                            b.createdAt?.seconds ||
                            0
                        )
                        -
                        (
                            a.createdAt?.seconds ||
                            0
                        )
                );


        renderTeamSearch(
            getElement(
                "teamSearchInput"
            )?.value ||
            ""
        );

    }

    catch (error) {

        console.error(
            "LOAD TEAMS ERROR:",
            error
        );


        container.innerHTML = `
            <div class="teams-error">
                UNABLE TO LOAD REGISTERED TEAMS.
            </div>
        `;
    }
}


/* =========================================
   SEARCH TEAMS
========================================= */

function renderTeamSearch(
    value = ""
) {

    const container =
        getElement(
            "registeredTeams"
        );


    if (!container) {
        return;
    }


    const search =
        String(value)
            .toLowerCase()
            .trim();


    const teams =
        search
            ? registeredTeamsData.filter(
                team => {

                    const name =
                        String(
                            team.teamName ||
                            ""
                        )
                        .toLowerCase();


                    const tag =
                        String(
                            team.teamTag ||
                            ""
                        )
                        .toLowerCase();


                    return (
                        name.includes(search) ||
                        tag.includes(search)
                    );
                }
            )
            : registeredTeamsData;


    if (!teams.length) {

        container.innerHTML = `
            <div class="no-teams">
                NO TEAMS FOUND.
            </div>
        `;

        return;
    }


    container.innerHTML =
        teams
            .map(
                renderTeamCard
            )
            .join("");
}


/* =========================================
   TEAM CARD
========================================= */

function renderTeamCard(
    team
) {

    const playerCount =
        Number(
            team.playerCount ||
            0
        );


    const isFull =
        playerCount >= 8;


    const isOwnTeam =
        currentTeam?.id ===
        team.id;


    let buttonText =
        "REQUEST TO JOIN";


    let disabled =
        false;


    if (isFull) {

        buttonText =
            "TEAM FULL";

        disabled =
            true;
    }


    if (isOwnTeam) {

        buttonText =
            "YOUR TEAM";

        disabled =
            true;
    }


    const logo =
        team.teamLogo

            ? `
                <img
                    src="${escapeHtml(
                        team.teamLogo
                    )}"
                    alt="${escapeHtml(
                        team.teamName ||
                        "Team"
                    )} logo"
                >
            `

            : `
                <span>
                    ${escapeHtml(
                        String(
                            team.teamName ||
                            "T"
                        ).charAt(0)
                    )}
                </span>
            `;


    return `
        <div class="team-list-card">

            <div class="team-list-logo">
                ${logo}
            </div>


            <div class="team-list-info">

                <small>
                    REGISTERED TEAM
                </small>


                <h3>
                    ${escapeHtml(
                        team.teamName ||
                        "Unnamed Team"
                    )}
                </h3>


                <div class="team-list-meta">

                    <span>
                        TAG:
                        ${escapeHtml(
                            team.teamTag ||
                            "-"
                        )}
                    </span>


                    <span>
                        PLAYERS:
                        ${playerCount}/8
                    </span>

                </div>

            </div>


            <button
                type="button"
                class="join-team-btn"
                data-team-id="${escapeHtml(
                    team.id
                )}"
                ${disabled ? "disabled" : ""}
            >
                ${buttonText}
            </button>

        </div>
    `;
}


/* =========================================
   SEND JOIN REQUEST
========================================= */

async function sendJoinRequest(
    teamId,
    button
) {

    if (
        !currentUser ||
        !teamId ||
        !button
    ) {
        return;
    }


    try {

        button.disabled =
            true;


        button.textContent =
            "CHECKING...";


        /* GET TEAM */

        const teamReference =
            doc(
                db,
                "teams",
                teamId
            );


        const teamSnapshot =
            await getDoc(
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


        const playerCount =
            Number(
                team.playerCount ||
                0
            );


        if (
            playerCount >= 8
        ) {

            throw new Error(
                "THIS TEAM IS FULL."
            );
        }


        /*
           IMPORTANT:
           We do not query team_members here.
           This was the operation that was causing
           the previous permission problem.
        */


        const requestId =
            `${teamId}_${currentUser.uid}`;


        const requestReference =
            doc(
                db,
                "team_requests",
                requestId
            );


        /*
           Directly create the request.
        */

        await setDoc(
            requestReference,
            {

                teamId:
                    teamId,

                playerId:
                    currentUser.uid,

                playerName:
                    currentUser.displayName ||
                    currentUser.email ||
                    "Player",

                captainId:
                    team.captainId,

                teamName:
                    team.teamName ||
                    "",

                status:
                    "pending",

                createdAt:
                    serverTimestamp()

            }
        );


        button.textContent =
            "REQUESTED";


        button.classList.add(
            "requested"
        );


        const joinStatus =
            getElement(
                "joinStatus"
            );


        if (joinStatus) {

            joinStatus.textContent =
                "JOIN REQUEST SENT SUCCESSFULLY ✓";
        }

    }

    catch (error) {

        console.error(
            "JOIN REQUEST ERROR:",
            error
        );


        const joinStatus =
            getElement(
                "joinStatus"
            );


        if (joinStatus) {

            joinStatus.textContent =
                error.message ||
                "UNABLE TO SEND JOIN REQUEST.";
        }


        button.disabled =
            false;


        button.textContent =
            "REQUEST TO JOIN";


        button.classList.remove(
            "requested"
        );
    }
}


/* =========================================
   CAPTAIN REQUESTS
========================================= */

async function loadCaptainRequests() {

    const section =
        getElement(
            "teamRequestsSection"
        );


    const list =
        getElement(
            "teamRequestsList"
        );


    const count =
        getElement(
            "requestCount"
        );


    if (
        !section ||
        !list ||
        !count ||
        !currentTeam ||
        !currentUser
    ) {

        return;
    }


    if (
        currentTeam.captainId !==
        currentUser.uid
    ) {

        return;
    }


    section.classList.remove(
        "hidden"
    );


    list.innerHTML = `
        <div class="requests-loading">
            LOADING JOIN REQUESTS...
        </div>
    `;


    try {

        const snapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "team_requests"
                    ),
                    where(
                        "captainId",
                        "==",
                        currentUser.uid
                    )
                )
            );


        const requests =
            snapshot.docs

                .map(
                    requestDoc => ({

                        id:
                            requestDoc.id,

                        ...requestDoc.data()

                    })
                )

                .filter(
                    request =>
                        request.teamId ===
                            currentTeam.id
                        &&
                        request.status ===
                            "pending"
                );


        count.textContent =
            requests.length;


        if (
            !requests.length
        ) {

            list.innerHTML = `
                <div class="no-teams">
                    NO PENDING JOIN REQUESTS.
                </div>
            `;

            return;
        }


        list.innerHTML =
            requests
                .map(
                    renderJoinRequest
                )
                .join("");

    }

    catch (error) {

        console.error(
            "REQUEST LOAD ERROR:",
            error
        );


        list.innerHTML = `
            <div class="teams-error">
                UNABLE TO LOAD JOIN REQUESTS.
            </div>
        `;
    }
}


/* =========================================
   REQUEST CARD
========================================= */

function renderJoinRequest(
    request
) {

    const initial =
        String(
            request.playerName ||
            "P"
        )
        .charAt(0)
        .toUpperCase();


    return `
        <div class="join-request-card">

            <div class="request-player-icon">
                ${escapeHtml(initial)}
            </div>


            <div class="request-player-info">

                <strong>
                    ${escapeHtml(
                        request.playerName ||
                        "Player"
                    )}
                </strong>


                <small>
                    WANTS TO JOIN YOUR TEAM
                </small>

            </div>


            <div class="request-actions">

                <button
                    type="button"
                    class="approve-btn"
                    data-action="approve"
                    data-request-id="${escapeHtml(
                        request.id
                    )}"
                >
                    APPROVE
                </button>


                <button
                    type="button"
                    class="reject-btn"
                    data-action="reject"
                    data-request-id="${escapeHtml(
                        request.id
                    )}"
                >
                    REJECT
                </button>

            </div>

        </div>
    `;
}


/* =========================================
   PROCESS REQUEST
========================================= */

async function processJoinRequest(
    requestId,
    action
) {

    if (
        !currentUser ||
        !currentTeam
    ) {
        return;
    }


    if (
        currentTeam.captainId !==
        currentUser.uid
    ) {
        return;
    }


    try {

        const requestReference =
            doc(
                db,
                "team_requests",
                requestId
            );


        const requestSnapshot =
            await getDoc(
                requestReference
            );


        if (
            !requestSnapshot.exists()
        ) {

            throw new Error(
                "JOIN REQUEST NOT FOUND."
            );
        }


        const request =
            requestSnapshot.data();


        if (
            request.captainId !==
            currentUser.uid
        ) {

            throw new Error(
                "YOU ARE NOT ALLOWED TO PROCESS THIS REQUEST."
            );
        }


        if (
            request.teamId !==
            currentTeam.id
        ) {

            throw new Error(
                "INVALID TEAM REQUEST."
            );
        }


        if (
            request.status !==
            "pending"
        ) {

            throw new Error(
                "REQUEST ALREADY PROCESSED."
            );
        }


        /* REJECT */

        if (
            action ===
            "reject"
        ) {

            await updateDoc(
                requestReference,
                {
                    status:
                        "rejected"
                }
            );


            await loadCaptainRequests();

            return;
        }


        if (
            action !==
            "approve"
        ) {

            return;
        }


        /* APPROVE */

        const teamReference =
            doc(
                db,
                "teams",
                currentTeam.id
            );


        const teamSnapshot =
            await getDoc(
                teamReference
            );


        if (
            !teamSnapshot.exists()
        ) {

            throw new Error(
                "TEAM NOT FOUND."
            );
        }


        const team =
            teamSnapshot.data();


        const playerCount =
            Number(
                team.playerCount ||
                0
            );


        if (
            playerCount >= 8
        ) {

            throw new Error(
                "TEAM IS FULL. MAXIMUM 8 PLAYERS."
            );
        }


        /*
           Check whether requested player
           already belongs to any team.
        */

        const membershipSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "team_members"
                    ),
                    where(
                        "playerId",
                        "==",
                        request.playerId
                    )
                )
            );


        if (
            !membershipSnapshot.empty
        ) {

            throw new Error(
                "THIS PLAYER IS ALREADY IN A TEAM."
            );
        }


        const memberId =
            `${currentTeam.id}_${request.playerId}`;


        await setDoc(
            doc(
                db,
                "team_members",
                memberId
            ),
            {

                teamId:
                    currentTeam.id,

                playerId:
                    request.playerId,

                playerName:
                    request.playerName ||
                    "Player",

                role:
                    "player",

                joinedAt:
                    serverTimestamp()

            }
        );


        const newCount =
            playerCount + 1;


        await updateDoc(
            teamReference,
            {

                playerCount:
                    newCount,

                tournamentEligible:
                    newCount >= 4

            }
        );


        await updateDoc(
            requestReference,
            {

                status:
                    "approved"

            }
        );


        currentTeam.playerCount =
            newCount;


        currentTeam.tournamentEligible =
            newCount >= 4;


        await showMyTeam();


        alert(
            "PLAYER APPROVED SUCCESSFULLY ✓"
        );

    }

    catch (error) {

        console.error(
            "REQUEST ACTION ERROR:",
            error
        );


        alert(
            error.message ||
            "UNABLE TO PROCESS REQUEST."
        );
    }
}


/* =========================================
   TEAM ROSTER
========================================= */

async function loadTeamRoster() {

    const roster =
        getElement(
            "teamRoster"
        );


    const rosterCount =
        getElement(
            "rosterCount"
        );


    if (
        !currentTeam ||
        !roster ||
        !rosterCount
    ) {

        return;
    }


    try {

        const snapshot =
            await getDocs(
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
                )
            );


        const members =
            snapshot.docs

                .map(
                    memberDoc => ({

                        id:
                            memberDoc.id,

                        ...memberDoc.data()

                    })
                )

                .sort(
                    (a, b) => {

                        if (
                            a.role ===
                            "captain"
                        ) {

                            return -1;
                        }


                        if (
                            b.role ===
                            "captain"
                        ) {

                            return 1;
                        }


                        return 0;
                    }
                );


        currentTeam.playerCount =
            members.length;


        currentTeam.tournamentEligible =
            members.length >= 4;


        rosterCount.textContent =
            members.length;


        if (
            getElement(
                "myPlayerCount"
            )
        ) {

            getElement(
                "myPlayerCount"
            ).textContent =
                members.length;
        }


        updateEligibility(
            members.length
        );


        if (
            !members.length
        ) {

            roster.innerHTML = `
                <div class="no-teams">
                    NO PLAYERS YET.
                </div>
            `;

            return;
        }


        roster.innerHTML =
            members
                .map(
                    (
                        member,
                        index
                    ) => {

                        return `
                            <div class="roster-player">

                                <div class="roster-number">
                                    ${String(
                                        index + 1
                                    ).padStart(
                                        2,
                                        "0"
                                    )}
                                </div>


                                <div class="roster-player-info">

                                    <strong>
                                        ${escapeHtml(
                                            member.playerName ||
                                            "Player"
                                        )}
                                    </strong>


                                    <small>
                                        ${
                                            member.role ===
                                            "captain"

                                                ? "CAPTAIN"

                                                : "PLAYER"
                                        }
                                    </small>

                                </div>

                            </div>
                        `;
                    }
                )
                .join("");

    }

    catch (error) {

        console.error(
            "ROSTER LOAD ERROR:",
            error
        );


        roster.innerHTML = `
            <div class="teams-error">
                UNABLE TO LOAD TEAM ROSTER.
            </div>
        `;
    }
}


/* =========================================
   LEAVE TEAM
========================================= */

async function leaveCurrentTeam() {

    if (
        !currentUser ||
        !currentTeam ||
        !currentMembershipId
    ) {

        return;
    }


    if (
        currentTeam.captainId ===
        currentUser.uid
    ) {

        alert(
            "CAPTAIN CANNOT LEAVE. USE DISBAND TEAM."
        );

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


        const teamReference =
            doc(
                db,
                "teams",
                currentTeam.id
            );


        const teamSnapshot =
            await getDoc(
                teamReference
            );


        if (
            teamSnapshot.exists()
        ) {

            const team =
                teamSnapshot.data();


            const newCount =
                Math.max(
                    1,
                    Number(
                        team.playerCount ||
                        1
                    ) - 1
                );


            await updateDoc(
                teamReference,
                {

                    playerCount:
                        newCount,

                    tournamentEligible:
                        newCount >= 4

                }
            );
        }


        window.location.reload();

    }

    catch (error) {

        console.error(
            "LEAVE TEAM ERROR:",
            error
        );


        alert(
            error.message ||
            "UNABLE TO LEAVE TEAM."
        );
    }
}


/* =========================================
   DISBAND TEAM
========================================= */

async function disbandCurrentTeam() {

    if (
        !currentUser ||
        !currentTeam
    ) {

        return;
    }


    if (
        currentTeam.captainId !==
        currentUser.uid
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

        const teamId =
            currentTeam.id;


        const membersSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "team_members"
                    ),
                    where(
                        "teamId",
                        "==",
                        teamId
                    )
                )
            );


        const requestsSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "team_requests"
                    ),
                    where(
                        "teamId",
                        "==",
                        teamId
                    )
                )
            );


        const batch =
            writeBatch(db);


        membersSnapshot.docs.forEach(
            memberDoc => {

                batch.delete(
                    memberDoc.ref
                );
            }
        );


        requestsSnapshot.docs.forEach(
            requestDoc => {

                batch.delete(
                    requestDoc.ref
                );
            }
        );


        batch.delete(
            doc(
                db,
                "teams",
                teamId
            )
        );


        await batch.commit();


        window.location.reload();

    }

    catch (error) {

        console.error(
            "DISBAND TEAM ERROR:",
            error
        );


        alert(
            error.message ||
            "UNABLE TO DISBAND TEAM."
        );
    }
}


/* =========================================
   LOGO PREVIEW
========================================= */

function setupLogoPreview() {

    const input =
        getElement(
            "teamLogoInput"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "change",
        () => {

            const file =
                input.files?.[0];


            if (!file) {
                return;
            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                setTeamStatus(
                    "PLEASE SELECT AN IMAGE FILE.",
                    true
                );


                input.value =
                    "";

                return;
            }


            if (
                file.size >
                5 * 1024 * 1024
            ) {

                setTeamStatus(
                    "TEAM LOGO MUST BE UNDER 5MB.",
                    true
                );


                input.value =
                    "";

                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                () => {

                    const image =
                        getElement(
                            "logoImage"
                        );


                    const placeholder =
                        getElement(
                            "logoPlaceholder"
                        );


                    if (image) {

                        image.src =
                            reader.result;

                        image.style.display =
                            "block";
                    }


                    if (placeholder) {

                        placeholder.style.display =
                            "none";
                    }
                };


            reader.readAsDataURL(
                file
            );
        }
    );
}


/* =========================================
   EVENT LISTENERS
========================================= */

function setupEvents() {

    getElement(
        "createTeamBtn"
    )?.addEventListener(
        "click",
        showCreateTeamPanel
    );


    getElement(
        "joinTeamBtn"
    )?.addEventListener(
        "click",
        showJoinTeamPanel
    );


    getElement(
        "closeCreateBtn"
    )?.addEventListener(
        "click",
        showTeamCenter
    );


    getElement(
        "closeJoinBtn"
    )?.addEventListener(
        "click",
        showTeamCenter
    );


    getElement(
        "teamForm"
    )?.addEventListener(
        "submit",
        handleCreateTeam
    );


    getElement(
        "leaveTeamBtn"
    )?.addEventListener(
        "click",
        leaveCurrentTeam
    );


    getElement(
        "disbandTeamBtn"
    )?.addEventListener(
        "click",
        disbandCurrentTeam
    );


    getElement(
        "teamSearchInput"
    )?.addEventListener(
        "input",
        event => {

            renderTeamSearch(
                event.target.value
            );
        }
    );


    getElement(
        "registeredTeams"
    )?.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    ".join-team-btn"
                );


            if (
                !button ||
                button.disabled
            ) {

                return;
            }


            const teamId =
                button.dataset.teamId;


            if (!teamId) {
                return;
            }


            await sendJoinRequest(
                teamId,
                button
            );
        }
    );


    getElement(
        "teamRequestsList"
    )?.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (!button) {
                return;
            }


            const requestId =
                button.dataset.requestId;


            const action =
                button.dataset.action;


            if (
                !requestId ||
                !action
            ) {

                return;
            }


            await processJoinRequest(
                requestId,
                action
            );
        }
    );
}


/* =========================================
   INITIALIZATION
========================================= */

function initializeTeamPage() {

    setupEvents();

    setupLogoPreview();


    onAuthStateChanged(
        auth,
        async user => {

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
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeTeamPage,
        {
            once: true
        }
    );

}

else {

    initializeTeamPage();
}
