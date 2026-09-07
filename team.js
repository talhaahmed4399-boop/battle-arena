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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

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

const CLOUD_NAME = "p6502iog";
const UPLOAD_PRESET = "battle_arena_profiles";
const CLOUDINARY_URL =
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

let currentUser = null;
let currentTeam = null;
let currentMembershipId = null;

function el(id) {
    return document.getElementById(id);
}

function showTeamCenter() {
    const teamCenter = el("teamCenter");
    const createTeamPanel = el("createTeamPanel");
    const joinTeamPanel = el("joinTeamPanel");
    const myTeamPanel = el("myTeamPanel");

    if (teamCenter) teamCenter.classList.remove("hidden");
    if (createTeamPanel) createTeamPanel.classList.add("hidden");
    if (joinTeamPanel) joinTeamPanel.classList.add("hidden");
    if (myTeamPanel) myTeamPanel.classList.add("hidden");
}

function showCreateTeam() {
    const teamCenter = el("teamCenter");
    const createTeamPanel = el("createTeamPanel");
    const joinTeamPanel = el("joinTeamPanel");
    const myTeamPanel = el("myTeamPanel");

    if (teamCenter) teamCenter.classList.add("hidden");
    if (joinTeamPanel) joinTeamPanel.classList.add("hidden");
    if (myTeamPanel) myTeamPanel.classList.add("hidden");
    if (createTeamPanel) createTeamPanel.classList.remove("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function showJoinTeam() {
    const teamCenter = el("teamCenter");
    const createTeamPanel = el("createTeamPanel");
    const joinTeamPanel = el("joinTeamPanel");
    const myTeamPanel = el("myTeamPanel");

    if (teamCenter) teamCenter.classList.add("hidden");
    if (createTeamPanel) createTeamPanel.classList.add("hidden");
    if (myTeamPanel) myTeamPanel.classList.add("hidden");
    if (joinTeamPanel) joinTeamPanel.classList.remove("hidden");

    await loadRegisteredTeams();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function findExistingTeam() {
    try {
        const snapshot = await getDocs(
            query(
                collection(db, "team_members"),
                where("playerId", "==", currentUser.uid)
            )
        );

        if (snapshot.empty) {
            currentTeam = null;
            currentMembershipId = null;
            showTeamCenter();
            return;
        }

        const memberDoc = snapshot.docs[0];
        currentMembershipId = memberDoc.id;

        const memberData = memberDoc.data();

        if (!memberData.teamId) {
            currentTeam = null;
            currentMembershipId = null;
            showTeamCenter();
            return;
        }

        const teamSnap = await getDoc(
            doc(db, "teams", memberData.teamId)
        );

        if (!teamSnap.exists()) {
            currentTeam = null;
            currentMembershipId = null;
            showTeamCenter();
            return;
        }

        currentTeam = {
            id: teamSnap.id,
            ...teamSnap.data()
        };

        await showMyTeam();

    } catch (error) {
        console.error("TEAM LOAD ERROR:", error);
        showTeamCenter();
    }
}

async function createTeam(event) {
    event.preventDefault();

    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    const teamName = (el("teamName")?.value || "").trim();
    const teamTag = (el("teamTag")?.value || "").trim().toUpperCase();
    const captainName = (el("captainName")?.value || "").trim();
    const captainWhatsapp = (el("captainWhatsapp")?.value || "").trim();
    const teamMotive = (el("teamMotive")?.value || "").trim();

    if (
        !teamName ||
        !teamTag ||
        !captainName ||
        !captainWhatsapp ||
        !teamMotive
    ) {
        setTeamStatus("PLEASE COMPLETE ALL TEAM INFORMATION.", true);
        return;
    }

    const file = el("teamLogoInput")?.files?.[0];

    if (!file) {
        setTeamStatus("PLEASE UPLOAD A TEAM LOGO.", true);
        return;
    }

    const saveButton = el("saveTeamBtn");

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "CREATING TEAM...";
    }

    try {
        const existingMembership = await getDocs(
            query(
                collection(db, "team_members"),
                where("playerId", "==", currentUser.uid)
            )
        );

        if (!existingMembership.empty) {
            throw new Error("YOU ARE ALREADY A MEMBER OF A TEAM.");
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        const uploadResponse = await fetch(
            CLOUDINARY_URL,
            {
                method: "POST",
                body: formData
            }
        );

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok) {
            throw new Error(
                uploadResult?.error?.message ||
                "TEAM LOGO UPLOAD FAILED."
            );
        }

        const teamReference = await addDoc(
            collection(db, "teams"),
            {
                teamName,
                teamTag,
                teamLogo: uploadResult.secure_url,
                captainId: currentUser.uid,
                captainName,
                captainWhatsapp,
                motive: teamMotive,
                playerCount: 1,
                tournamentEligible: false,
                createdAt: serverTimestamp()
            }
        );

        const membershipReference = await addDoc(
            collection(db, "team_members"),
            {
                teamId: teamReference.id,
                playerId: currentUser.uid,
                playerName: captainName,
                role: "captain",
                joinedAt: serverTimestamp()
            }
        );

        currentMembershipId = membershipReference.id;

        currentTeam = {
            id: teamReference.id,
            teamName,
            teamTag,
            teamLogo: uploadResult.secure_url,
            captainId: currentUser.uid,
            captainName,
            captainWhatsapp,
            motive: teamMotive,
            playerCount: 1,
            tournamentEligible: false
        };

        el("teamForm")?.reset();

        const logoImage = el("logoImage");
        const logoPlaceholder = el("logoPlaceholder");

        if (logoImage) {
            logoImage.src = "";
            logoImage.style.display = "none";
        }

        if (logoPlaceholder) {
            logoPlaceholder.style.display = "block";
        }

        setTeamStatus("TEAM CREATED SUCCESSFULLY ✓", false);

        await showMyTeam();

    } catch (error) {
        console.error("CREATE TEAM ERROR:", error);
        setTeamStatus(
            error.message || "UNABLE TO CREATE TEAM.",
            true
        );
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = "CREATE TEAM";
        }
    }
}

async function showMyTeam() {
    if (!currentTeam) {
        showTeamCenter();
        return;
    }

    const teamCenter = el("teamCenter");
    const createTeamPanel = el("createTeamPanel");
    const joinTeamPanel = el("joinTeamPanel");
    const myTeamPanel = el("myTeamPanel");

    if (teamCenter) teamCenter.classList.add("hidden");
    if (createTeamPanel) createTeamPanel.classList.add("hidden");
    if (joinTeamPanel) joinTeamPanel.classList.add("hidden");
    if (myTeamPanel) myTeamPanel.classList.remove("hidden");

    const name = el("myTeamName");
    const tag = el("myTeamTag");
    const captain = el("myCaptainName");
    const motive = el("myTeamMotive");
    const count = el("myPlayerCount");
    const logo = el("myTeamLogoImage");
    const eligibility = el("myTeamEligibility");
    const leaveBtn = el("leaveTeamBtn");
    const disbandBtn = el("disbandTeamBtn");

    if (name) name.textContent = currentTeam.teamName || "-";
    if (tag) tag.textContent = currentTeam.teamTag || "-";
    if (captain) captain.textContent = currentTeam.captainName || "-";
    if (motive) motive.textContent = currentTeam.motive || "-";
    if (count) count.textContent = currentTeam.playerCount || 1;

    if (logo && currentTeam.teamLogo) {
        logo.src = currentTeam.teamLogo;
    }

    if (Number(currentTeam.playerCount || 1) >= 4) {
        if (eligibility) {
            eligibility.textContent = "TOURNAMENT READY";
            eligibility.className = "status-ready";
        }
    } else {
        if (eligibility) {
            eligibility.textContent = "WAITING FOR PLAYERS";
            eligibility.className = "status-pending";
        }
    }

    const isCaptain =
        currentTeam.captainId === currentUser.uid;

    if (isCaptain) {
        if (leaveBtn) leaveBtn.classList.add("hidden");
        if (disbandBtn) disbandBtn.classList.remove("hidden");
    } else {
        if (leaveBtn) leaveBtn.classList.remove("hidden");
        if (disbandBtn) disbandBtn.classList.add("hidden");
    }

    await loadTeamRoster();

    if (isCaptain) {
        await loadCaptainRequests();
    }
}

async function loadRegisteredTeams() {
    const container = el("registeredTeams");

    if (!container) return;

    container.innerHTML = `
        <div class="teams-loading">LOADING TEAMS...</div>
    `;

    try {
        const snapshot = await getDocs(
            collection(db, "teams")
        );

        registeredTeamsData = snapshot.docs
            .map(teamDoc => ({
                id: teamDoc.id,
                ...teamDoc.data()
            }))
            .sort((a, b) => {
                const aTime = a.createdAt?.seconds || 0;
                const bTime = b.createdAt?.seconds || 0;
                return bTime - aTime;
            });

        renderTeamSearch("");

    } catch (error) {
        console.error("LOAD TEAMS ERROR:", error);

        container.innerHTML = `
            <div class="teams-error">
                UNABLE TO LOAD REGISTERED TEAMS.
            </div>
        `;
    }
}

let registeredTeamsData = [];

function renderTeamSearch(searchValue) {
    const container = el("registeredTeams");

    if (!container) return;

    const search = String(searchValue || "")
        .toLowerCase()
        .trim();

    let teams = registeredTeamsData;

    if (search) {
        teams = teams.filter(team => {
            const name = String(team.teamName || "").toLowerCase();
            const tag = String(team.teamTag || "").toLowerCase();

            return (
                name.includes(search) ||
                tag.includes(search)
            );
        });
    }

    if (!teams.length) {
        container.innerHTML = `
            <div class="no-teams">NO TEAMS FOUND.</div>
        `;
        return;
    }

    container.innerHTML =
        teams.map(renderTeamCard).join("");
}

function renderTeamCard(team) {
    const playerCount = Number(team.playerCount || 0);
    const full = playerCount >= 8;
    const ownTeam = currentTeam?.id === team.id;

    let buttonText = "REQUEST TO JOIN";
    let disabled = false;

    if (full) {
        buttonText = "TEAM FULL";
        disabled = true;
    }

    if (ownTeam) {
        buttonText = "YOUR TEAM";
        disabled = true;
    }

    const logo = team.teamLogo
        ? `<img src="${escapeHtml(team.teamLogo)}" alt="Team Logo">`
        : `<span>${escapeHtml(
              String(team.teamName || "T").charAt(0)
          )}</span>`;

    return `
        <div class="team-list-card">
            <div class="team-list-logo">
                ${logo}
            </div>

            <div class="team-list-info">
                <small>REGISTERED TEAM</small>

                <h3>
                    ${escapeHtml(team.teamName || "Unnamed Team")}
                </h3>

                <div class="team-list-meta">
                    <span>
                        TAG:
                        ${escapeHtml(team.teamTag || "-")}
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
                data-team-id="${escapeHtml(team.id)}"
                ${disabled ? "disabled" : ""}
            >
                ${buttonText}
            </button>
        </div>
    `;
}

async function sendJoinRequest(teamId, button) {
    if (!currentUser || !teamId || !button) return;

    try {
        button.disabled = true;
        button.textContent = "CHECKING...";

        const membershipSnapshot = await getDocs(
            query(
                collection(db, "team_members"),
                where("playerId", "==", currentUser.uid)
            )
        );

        if (!membershipSnapshot.empty) {
            throw new Error("YOU ARE ALREADY A MEMBER OF A TEAM.");
        }

        const teamSnapshot = await getDoc(
            doc(db, "teams", teamId)
        );

        if (!teamSnapshot.exists()) {
            throw new Error("TEAM NO LONGER EXISTS.");
        }

        const team = teamSnapshot.data();
        const playerCount = Number(team.playerCount || 0);

        if (playerCount >= 8) {
            throw new Error("THIS TEAM IS FULL.");
        }

        const requestId =
            `${teamId}_${currentUser.uid}`;

        const requestRef = doc(
            db,
            "team_requests",
            requestId
        );

        const existingRequest = await getDoc(requestRef);

        if (existingRequest.exists()) {
            const status = existingRequest.data().status;

            if (status === "pending") {
                button.textContent = "REQUESTED";
                button.classList.add("requested");

                const statusEl = el("joinStatus");
                if (statusEl) {
                    statusEl.textContent =
                        "JOIN REQUEST ALREADY SENT.";
                }

                return;
            }
        }

        await setDoc(
            requestRef,
            {
                teamId,
                playerId: currentUser.uid,
                playerName:
                    currentUser.displayName ||
                    currentUser.email ||
                    "Player",
                captainId: team.captainId,
                teamName: team.teamName || "",
                status: "pending",
                createdAt: serverTimestamp()
            }
        );

        button.textContent = "REQUESTED";
        button.classList.add("requested");

        const statusEl = el("joinStatus");
        if (statusEl) {
            statusEl.textContent =
                "JOIN REQUEST SENT SUCCESSFULLY ✓";
        }

    } catch (error) {
        console.error("JOIN REQUEST ERROR:", error);

        const statusEl = el("joinStatus");
        if (statusEl) {
            statusEl.textContent =
                error.message ||
                "UNABLE TO SEND JOIN REQUEST.";
        }

        button.disabled = false;
        button.textContent = "REQUEST TO JOIN";
    }
}

async function loadCaptainRequests() {
    const section = el("teamRequestsSection");
    const list = el("teamRequestsList");
    const count = el("requestCount");

    if (
        !currentTeam ||
        !currentUser ||
        currentTeam.captainId !== currentUser.uid ||
        !section ||
        !list ||
        !count
    ) {
        return;
    }

    section.classList.remove("hidden");

    list.innerHTML = `
        <div class="requests-loading">
            LOADING JOIN REQUESTS...
        </div>
    `;

    try {
        const snapshot = await getDocs(
            query(
                collection(db, "team_requests"),
                where("captainId", "==", currentUser.uid)
            )
        );

        const requests = snapshot.docs
            .map(requestDoc => ({
                id: requestDoc.id,
                ...requestDoc.data()
            }))
            .filter(
                request =>
                    request.teamId === currentTeam.id &&
                    request.status === "pending"
            );

        count.textContent = requests.length;

        if (!requests.length) {
            list.innerHTML = `
                <div class="no-teams">
                    NO PENDING JOIN REQUESTS.
                </div>
            `;
            return;
        }

        list.innerHTML =
            requests.map(renderJoinRequest).join("");

    } catch (error) {
        console.error("REQUEST LOAD ERROR:", error);

        list.innerHTML = `
            <div class="teams-error">
                UNABLE TO LOAD JOIN REQUESTS.
            </div>
        `;
    }
}

function renderJoinRequest(request) {
    const initial = String(
        request.playerName || "P"
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
                        request.playerName || "Player"
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
                    data-request-id="${escapeHtml(request.id)}"
                >
                    APPROVE
                </button>

                <button
                    type="button"
                    class="reject-btn"
                    data-action="reject"
                    data-request-id="${escapeHtml(request.id)}"
                >
                    REJECT
                </button>
            </div>
        </div>
    `;
}

async function handleJoinRequest(requestId, action) {
    if (
        !currentUser ||
        !currentTeam ||
        currentTeam.captainId !== currentUser.uid
    ) {
        return;
    }

    try {
        const requestRef = doc(
            db,
            "team_requests",
            requestId
        );

        const requestSnapshot =
            await getDoc(requestRef);

        if (!requestSnapshot.exists()) {
            throw new Error("JOIN REQUEST NOT FOUND.");
        }

        const request = requestSnapshot.data();

        if (request.status !== "pending") {
            throw new Error("REQUEST ALREADY PROCESSED.");
        }

        if (action === "reject") {
            await updateDoc(
                requestRef,
                { status: "rejected" }
            );

            await loadCaptainRequests();
            return;
        }

        const teamRef = doc(
            db,
            "teams",
            currentTeam.id
        );

        const teamSnapshot =
            await getDoc(teamRef);

        if (!teamSnapshot.exists()) {
            throw new Error("TEAM NOT FOUND.");
        }

        const team = teamSnapshot.data();
        const playerCount =
            Number(team.playerCount || 0);

        if (playerCount >= 8) {
            throw new Error(
                "TEAM IS FULL. MAXIMUM 8 PLAYERS."
            );
        }

        const membershipSnapshot =
            await getDocs(
                query(
                    collection(db, "team_members"),
                    where(
                        "playerId",
                        "==",
                        request.playerId
                    )
                )
            );

        if (!membershipSnapshot.empty) {
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
                teamId: currentTeam.id,
                playerId: request.playerId,
                playerName:
                    request.playerName || "Player",
                role: "player",
                joinedAt: serverTimestamp()
            }
        );

        const newCount =
            playerCount + 1;

        await updateDoc(
            teamRef,
            {
                playerCount: newCount,
                tournamentEligible: newCount >= 4
            }
        );

        await updateDoc(
            requestRef,
            {
                status: "approved"
            }
        );

        currentTeam.playerCount = newCount;
        currentTeam.tournamentEligible =
            newCount >= 4;

        await showMyTeam();
        await loadCaptainRequests();

        alert("PLAYER APPROVED SUCCESSFULLY ✓");

    } catch (error) {
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

async function loadTeamRoster() {
    if (!currentTeam) return;

    const roster = el("teamRoster");
    const rosterCount = el("rosterCount");

    if (!roster || !rosterCount) return;

    try {
        const snapshot = await getDocs(
            query(
                collection(db, "team_members"),
                where(
                    "teamId",
                    "==",
                    currentTeam.id
                )
            )
        );

        const members = snapshot.docs
            .map(memberDoc => ({
                id: memberDoc.id,
                ...memberDoc.data()
            }))
            .sort((a, b) => {
                if (a.role === "captain") return -1;
                if (b.role === "captain") return 1;
                return 0;
            });

        rosterCount.textContent =
            members.length;

        currentTeam.playerCount =
            members.length;

        currentTeam.tournamentEligible =
            members.length >= 4;

        const myCount = el("myPlayerCount");
        if (myCount) {
            myCount.textContent =
                members.length;
        }

        const eligibility =
            el("myTeamEligibility");

        if (eligibility) {
            if (members.length >= 4) {
                eligibility.textContent =
                    "TOURNAMENT READY";
                eligibility.className =
                    "status-ready";
            } else {
                eligibility.textContent =
                    "WAITING FOR PLAYERS";
                eligibility.className =
                    "status-pending";
            }
        }

        if (!members.length) {
            roster.innerHTML = `
                <div class="no-teams">
                    NO PLAYERS YET.
                </div>
            `;
            return;
        }

        roster.innerHTML =
            members.map((member, index) => `
                <div class="roster-player">
                    <div class="roster-number">
                        ${String(index + 1).padStart(2, "0")}
                    </div>

                    <div class="roster-player-info">
                        <strong>
                            ${escapeHtml(
                                member.playerName || "Player"
                            )}
                        </strong>

                        <small>
                            ${
                                member.role === "captain"
                                    ? "CAPTAIN"
                                    : "PLAYER"
                            }
                        </small>
                    </div>
                </div>
            `).join("");

    } catch (error) {
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

async function leaveTeam() {
    if (!currentMembershipId || !currentTeam) {
        return;
    }

    if (
        !confirm(
            "Are you sure you want to leave this team?"
        )
    ) {
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

        const newCount =
            Math.max(
                1,
                Number(currentTeam.playerCount || 1) - 1
            );

        await updateDoc(
            doc(db, "teams", currentTeam.id),
            {
                playerCount: newCount,
                tournamentEligible: newCount >= 4
            }
        );

        window.location.reload();

    } catch (error) {
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

async function disbandTeam() {
    if (!currentTeam?.id) return;

    if (
        !confirm(
            "Disband this team? This cannot be undone."
        )
    ) {
        return;
    }

    try {
        const teamId = currentTeam.id;

        const membersSnapshot =
            await getDocs(
                query(
                    collection(db, "team_members"),
                    where("teamId", "==", teamId)
                )
            );

        for (const member of membersSnapshot.docs) {
            await deleteDoc(member.ref);
        }

        const requestsSnapshot =
            await getDocs(
                query(
                    collection(db, "team_requests"),
                    where("teamId", "==", teamId)
                )
            );

        for (const request of requestsSnapshot.docs) {
            await deleteDoc(request.ref);
        }

        await deleteDoc(
            doc(db, "teams", teamId)
        );

        window.location.reload();

    } catch (error) {
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

function setupLogoPreview() {
    const input = el("teamLogoInput");
    const image = el("logoImage");
    const placeholder = el("logoPlaceholder");

    if (!input) return;

    input.addEventListener(
        "change",
        () => {
            const file = input.files?.[0];

            if (!file) return;

            if (!file.type.startsWith("image/")) {
                setTeamStatus(
                    "PLEASE SELECT AN IMAGE FILE.",
                    true
                );

                input.value = "";
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                setTeamStatus(
                    "TEAM LOGO MUST BE UNDER 5MB.",
                    true
                );

                input.value = "";
                return;
            }

            const reader = new FileReader();

            reader.onload = () => {
                if (image) {
                    image.src = reader.result;
                    image.style.display = "block";
                }

                if (placeholder) {
                    placeholder.style.display = "none";
                }
            };

            reader.readAsDataURL(file);
        }
    );
}

function setTeamStatus(message, error = false) {
    const status = el("teamStatus");

    if (!status) return;

    status.textContent = message;
    status.style.color =
        error ? "#ff5364" : "#28e7ff";
}

function setupEvents() {
    const createButton = el("createTeamBtn");
    const joinButton = el("joinTeamBtn");
    const closeCreate = el("closeCreateBtn");
    const closeJoin = el("closeJoinBtn");
    const form = el("teamForm");
    const leaveButton = el("leaveTeamBtn");
    const disbandButton = el("disbandTeamBtn");
    const searchInput = el("teamSearchInput");
    const registeredTeams = el("registeredTeams");
    const requestsList = el("teamRequestsList");

    createButton?.addEventListener(
        "click",
        showCreateTeam
    );

    joinButton?.addEventListener(
        "click",
        showJoinTeam
    );

    closeCreate?.addEventListener(
        "click",
        showTeamCenter
    );

    closeJoin?.addEventListener(
        "click",
        showTeamCenter
    );

    form?.addEventListener(
        "submit",
        createTeam
    );

    leaveButton?.addEventListener(
        "click",
        leaveTeam
    );

    disbandButton?.addEventListener(
        "click",
        disbandTeam
    );

    searchInput?.addEventListener(
        "input",
        event => {
            renderTeamSearch(
                event.target.value
            );
        }
    );

    registeredTeams?.addEventListener(
        "click",
        async event => {
            const button =
                event.target.closest(
                    ".join-team-btn"
                );

            if (!button) return;
            if (button.disabled) return;

            const teamId =
                button.dataset.teamId;

            if (!teamId) return;

            await sendJoinRequest(
                teamId,
                button
            );
        }
    );

    requestsList?.addEventListener(
        "click",
        async event => {
            const button =
                event.target.closest(
                    "[data-action]"
                );

            if (!button) return;

            const requestId =
                button.dataset.requestId;

            const action =
                button.dataset.action;

            if (!requestId || !action) return;

            await handleJoinRequest(
                requestId,
                action
            );
        }
    );
}

function validateCriticalElements() {
    const required = [
        "teamCenter",
        "createTeamPanel",
        "createTeamBtn",
        "joinTeamBtn",
        "joinTeamPanel",
        "teamForm"
    ];

    const missing = required.filter(
        id => !el(id)
    );

    if (missing.length) {
        console.warn(
            "TEAM HTML ELEMENTS MISSING:",
            missing
        );
    }
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

function initTeamPage() {
    validateCriticalElements();
    setupEvents();
    setupLogoPreview();

    onAuthStateChanged(
        auth,
        async user => {
            if (!user) {
                window.location.href = "index.html";
                return;
            }

            currentUser = user;

            await findExistingTeam();
        }
    );
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initTeamPage,
        { once: true }
    );
} else {
    initTeamPage();
}
