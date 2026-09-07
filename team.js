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
    setDoc,
    updateDoc,
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

    joinTeamPanel.classList.add(
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


closeJoinBtn.addEventListener(
    "click",
    () => {

        showTeamCenter();

    }
);


teamSearchInput.addEventListener(
    "input",
    () => {

        renderTeamSearch(
            teamSearchInput.value.trim()
        );

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
    /* =====================================
       LOAD TEAM ROSTER
    ===================================== */

    await loadTeamRoster();


    /* =====================================
       CAPTAIN JOIN REQUESTS
    ===================================== */

    if (
        currentTeam.captainId ===
        currentUser.uid
    ) {

        await loadCaptainRequests();

    }
        
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
/* =========================================
   REGISTERED TEAMS
========================================= */

let registeredTeamsData = [];


async function loadRegisteredTeams() {

    registeredTeams.innerHTML = `
        <div class="teams-loading">
            LOADING TEAMS...
        </div>
    `;


    joinStatus.textContent =
        "";


    try {

        const teamsSnapshot =
            await getDocs(
                collection(
                    db,
                    "teams"
                )
            );


        registeredTeamsData =
            teamsSnapshot.docs.map(
                teamDoc => ({
                    id:
                        teamDoc.id,

                    ...teamDoc.data()
                })
            );


        /*
         * Newest teams first
         */

        registeredTeamsData.sort(
            (a, b) => {

                const aTime =
                    a.createdAt?.seconds || 0;

                const bTime =
                    b.createdAt?.seconds || 0;

                return bTime - aTime;

            }
        );


        renderTeamSearch("");

    }

    catch (error) {

        console.error(
            "LOAD TEAMS ERROR:",
            error
        );


        registeredTeams.innerHTML = `
            <div class="teams-error">
                UNABLE TO LOAD REGISTERED TEAMS.
            </div>
        `;

    }

}


/* =========================================
   SEARCH / RENDER
========================================= */

function renderTeamSearch(
    searchValue
) {

    const search =
        searchValue
            .toLowerCase()
            .trim();


    let teams =
        registeredTeamsData;


    if (search) {

        teams =
            registeredTeamsData.filter(
                team => {

                    const name =
                        String(
                            team.teamName || ""
                        ).toLowerCase();


                    const tag =
                        String(
                            team.teamTag || ""
                        ).toLowerCase();


                    return (
                        name.includes(search) ||
                        tag.includes(search)
                    );

                }
            );

    }


    if (!teams.length) {

        registeredTeams.innerHTML = `
            <div class="no-teams">
                NO TEAMS FOUND.
            </div>
        `;

        return;
    }


    registeredTeams.innerHTML =
        teams.map(
            renderTeamCard
        ).join("");

}


/* =========================================
   TEAM CARD
========================================= */

function renderTeamCard(
    team
) {

    const playerCount =
        Number(
            team.playerCount || 0
        );


    const isFull =
        playerCount >= 8;


    const isOwnTeam =
        currentTeam &&
        currentTeam.id === team.id;


    let buttonText =
        "REQUEST TO JOIN";


    let disabled =
        false;


    let buttonClass =
        "join-team-btn";


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

        buttonClass +=
            " requested";

    }


    const logo =
        team.teamLogo
            ? `
                <img
                    src="${escapeHtml(
                        team.teamLogo
                    )}"
                    alt="${escapeHtml(
                        team.teamName || "Team"
                    )} logo"
                >
              `
            : `
                ${escapeHtml(
                    String(
                        team.teamName || "T"
                    ).charAt(0)
                )}
              `;


    return `

        <div
            class="team-list-card"
        >

            <div
                class="team-list-logo"
            >
                ${logo}
            </div>


            <div
                class="team-list-info"
            >

                <small>
                    REGISTERED TEAM
                </small>

                <h3>
                    ${escapeHtml(
                        team.teamName ||
                        "Unnamed Team"
                    )}
                </h3>


                <div
                    class="team-list-meta"
                >

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
                class="${buttonClass}"
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
   JOIN REQUEST CLICK
========================================= */

registeredTeams.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                ".join-team-btn"
            );


        if (!button) {
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


/* =========================================
   SEND JOIN REQUEST
========================================= */

async function sendJoinRequest(
    teamId,
    button
) {

    if (!currentUser) {
        return;
    }


    try {

        button.disabled =
            true;

        button.textContent =
            "CHECKING...";


        /* =====================================
           CHECK IF PLAYER ALREADY HAS TEAM
        ===================================== */

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


        /* =====================================
           GET TEAM
        ===================================== */

        const teamSnapshot =
            await getDoc(
                doc(
                    db,
                    "teams",
                    teamId
                )
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
                team.playerCount || 0
            );


        if (
            playerCount >= 8
        ) {

            throw new Error(
                "THIS TEAM IS FULL."
            );

        }


        /* =====================================
           CHECK EXISTING REQUEST
        ===================================== */

        const requestQuery =
            query(
                collection(
                    db,
                    "team_requests"
                ),
                where(
                    "teamId",
                    "==",
                    teamId
                ),
                where(
                    "playerId",
                    "==",
                    currentUser.uid
                ),
                where(
                    "status",
                    "==",
                    "pending"
                )
            );


        const requestSnapshot =
            await getDocs(
                requestQuery
            );


        if (
            !requestSnapshot.empty
        ) {

            button.textContent =
                "REQUESTED";

            button.classList.add(
                "requested"
            );

            joinStatus.textContent =
                "JOIN REQUEST ALREADY SENT.";

            return;

        }


        /* =====================================
           CREATE REQUEST
        ===================================== */

        const requestId =
    `${teamId}_${currentUser.uid}`;

await setDoc(
    doc(
        db,
        "team_requests",
        requestId
    ),
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
            team.teamName || "",

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


        joinStatus.textContent =
            "JOIN REQUEST SENT SUCCESSFULLY ✓";

    }

    catch (error) {

        console.error(
            "JOIN REQUEST ERROR:",
            error
        );


        joinStatus.textContent =
            error.message ||
            "UNABLE TO SEND JOIN REQUEST.";


        button.disabled =
            false;

        button.textContent =
            "REQUEST TO JOIN";

    }

}
function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value ?? "";

    return div.innerHTML;

}
/* =========================================
   CAPTAIN JOIN REQUESTS
========================================= */

async function loadCaptainRequests() {

    if (
        !currentTeam ||
        currentTeam.captainId !==
        currentUser.uid
    ) {
        return;
    }


    const section =
        document.getElementById(
            "teamRequestsSection"
        );

    const list =
        document.getElementById(
            "teamRequestsList"
        );

    const count =
        document.getElementById(
            "requestCount"
        );


    if (
        !section ||
        !list ||
        !count
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

        const requestQuery =
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
            );


        const snapshot =
            await getDocs(
                requestQuery
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

            <div
                class="request-player-icon"
            >
                ${escapeHtml(initial)}
            </div>


            <div
                class="request-player-info"
            >

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


            <div
                class="request-actions"
            >

                <button
                    type="button"
                    class="approve-btn"
                    data-request-id="${escapeHtml(
                        request.id
                    )}"
                    data-action="approve"
                >
                    APPROVE
                </button>


                <button
                    type="button"
                    class="reject-btn"
                    data-request-id="${escapeHtml(
                        request.id
                    )}"
                    data-action="reject"
                >
                    REJECT
                </button>

            </div>

        </div>

    `;

}


/* =========================================
   REQUEST BUTTON EVENTS
========================================= */

const requestsList =
    document.getElementById(
        "teamRequestsList"
    );


if (requestsList) {

    requestsList.addEventListener(
        "click",
        async function (event) {

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


            await handleJoinRequest(
                requestId,
                action
            );

        }
    );

}


/* =========================================
   HANDLE REQUEST
========================================= */

async function handleJoinRequest(
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

        const requestRef =
            doc(
                db,
                "team_requests",
                requestId
            );


        const requestSnapshot =
            await getDoc(
                requestRef
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
            request.status !==
            "pending"
        ) {

            throw new Error(
                "REQUEST ALREADY PROCESSED."
            );

        }


        /* =====================================
           REJECT
        ===================================== */

        if (
            action === "reject"
        ) {

            await updateDoc(
                requestRef,
                {
                    status:
                        "rejected"
                }
            );


            await loadCaptainRequests();

            return;

        }


        /* =====================================
           APPROVE
        ===================================== */

        const teamRef =
            doc(
                db,
                "teams",
                currentTeam.id
            );


        const teamSnapshot =
            await getDoc(
                teamRef
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
                team.playerCount || 0
            );


        /* MAXIMUM 8 */

        if (
            playerCount >= 8
        ) {

            throw new Error(
                "TEAM IS FULL. MAXIMUM 8 PLAYERS."
            );

        }


        /* =====================================
           CHECK PLAYER TEAM MEMBERSHIP
        ===================================== */

        const membershipQuery =
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
            );


        const membershipSnapshot =
            await getDocs(
                membershipQuery
            );


        if (
            !membershipSnapshot.empty
        ) {

            throw new Error(
                "THIS PLAYER IS ALREADY IN A TEAM."
            );

        }


        /* =====================================
           CREATE MEMBER
        ===================================== */

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


        /* =====================================
           UPDATE TEAM COUNT
        ===================================== */

        const newCount =
            playerCount + 1;


        await updateDoc(
            teamRef,
            {

                playerCount:
                    newCount,

                tournamentEligible:
                    newCount >= 4

            }
        );


        /* =====================================
           APPROVE REQUEST
        ===================================== */

        await updateDoc(
            requestRef,
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


        await loadCaptainRequests();


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

    if (
        !currentTeam
    ) {
        return;
    }


    const roster =
        document.getElementById(
            "teamRoster"
        );


    const rosterCount =
        document.getElementById(
            "rosterCount"
        );


    if (
        !roster ||
        !rosterCount
    ) {
        return;
    }


    try {

        const memberQuery =
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


        const snapshot =
            await getDocs(
                memberQuery
            );


        const members =
            snapshot.docs
                .map(
                    memberDoc => ({
                        id:
                            memberDoc.id,

                        ...memberDoc.data()
                    })
                );


        members.sort(
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


        rosterCount.textContent =
            members.length;


        currentTeam.playerCount =
            members.length;


        currentTeam.tournamentEligible =
            members.length >= 4;


        document.getElementById(
            "myPlayerCount"
        ).textContent =
            members.length;


        const eligibility =
            document.getElementById(
                "myTeamEligibility"
            );


        if (
            members.length >= 4
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
                    (member, index) => {

                        return `

                            <div class="roster-player">

                                <div class="roster-number">
                                    ${String(
                                        index + 1
                                    ).padStart(2, "0")}
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

                        ;

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
        ;

    }

}
