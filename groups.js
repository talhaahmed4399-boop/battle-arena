import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";


import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


import {
    getFirestore,
    collection,
    getDocs,
    query,
    orderBy
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
    initializeApp(
        firebaseConfig
    );


const auth =
    getAuth(app);


const db =
    getFirestore(app);



/* =========================================
   TOURNAMENT
========================================= */

const TOURNAMENT_ID =
    "battle-arena-showdown-s1";


const TOTAL_GROUPS =
    21;


const GROUP_CAPACITY =
    12;


const TOTAL_SLOTS =
    256;


const GROUPED_SLOTS =
    TOTAL_GROUPS *
    GROUP_CAPACITY;


const RESERVE_SLOTS =
    TOTAL_SLOTS -
    GROUPED_SLOTS;



/* =========================================
   STATE
========================================= */

let registrations = [];



/* =========================================
   ELEMENTS
========================================= */

const groupsContainer =
    document.getElementById(
        "groupsContainer"
    );


const reserveContainer =
    document.getElementById(
        "reserveContainer"
    );


const groupSearch =
    document.getElementById(
        "groupSearch"
    );


const groupFilter =
    document.getElementById(
        "groupFilter"
    );


const groupsStatus =
    document.getElementById(
        "groupsStatus"
    );



/* =========================================
   STATUS
========================================= */

function setStatus(
    text,
    error = false
) {

    groupsStatus.textContent =
        text;

    groupsStatus.className =
        error
            ? "groups-status error"
            : "groups-status";
}



/* =========================================
   GROUP NAME
========================================= */

function getGroupName(
    index
) {

    return `GROUP ${
        String.fromCharCode(
            65 + index
        )
    }`;
}



/* =========================================
   LOAD REGISTRATIONS
========================================= */

async function loadRegistrations() {

    setStatus(
        "LOADING LIVE TOURNAMENT GROUPS..."
    );


    try {

        const reference =
            collection(
                db,
                "tournament_registrations"
            );


        const snapshot =
            await getDocs(
                query(
                    reference,
                    orderBy(
                        "slotNumber",
                        "asc"
                    )
                )
            );


        registrations =
            snapshot.docs
                .map(
                    registrationDoc => ({
                        id:
                            registrationDoc.id,

                        ...registrationDoc.data()
                    })
                )
                .filter(
                    registration =>
                        registration.tournamentId ===
                        TOURNAMENT_ID
                );


        renderEverything();


        setStatus(
            `LIVE • ${registrations.length} TEAM${
                registrations.length === 1
                    ? ""
                    : "S"
            } REGISTERED`
        );

    }

    catch (error) {

        console.error(
            "GROUP LOAD ERROR:",
            error
        );


        setStatus(
            "UNABLE TO LOAD LIVE GROUPS.",
            true
        );

        groupsContainer.innerHTML = `
            <div class="group-card">

                <div class="group-header">

                    <div class="group-name">

                        <span>
                            ERROR
                        </span>

                        LIVE GROUP DATA UNAVAILABLE

                    </div>

                </div>

            </div>
        `;
    }
}



/* =========================================
   FILTER
========================================= */

function getFilteredRegistrations() {

    const search =
        String(
            groupSearch.value || ""
        )
        .toLowerCase()
        .trim();


    const selectedGroup =
        groupFilter.value;


    return registrations.filter(
        registration => {

            const name =
                String(
                    registration.teamName ||
                    ""
                )
                .toLowerCase();


            const tag =
                String(
                    registration.teamTag ||
                    ""
                )
                .toLowerCase();


            const group =
                String(
                    registration.groupName ||
                    ""
                );


            const matchesSearch =
                !search ||
                name.includes(search) ||
                tag.includes(search);


            const matchesGroup =
                selectedGroup === "all" ||
                group === selectedGroup;


            return (
                matchesSearch &&
                matchesGroup
            );

        }
    );
}



/* =========================================
   RENDER EVERYTHING
========================================= */

function renderEverything() {

    renderFilter();

    renderSummary();

    renderGroups();

    renderReserve();
}



/* =========================================
   GROUP FILTER
========================================= */

function renderFilter() {

    const current =
        groupFilter.value;


    let html = `
        <option value="all">
            ALL GROUPS
        </option>
    `;


    for (
        let index = 0;
        index < TOTAL_GROUPS;
        index++
    ) {

        const name =
            getGroupName(index);


        html += `
            <option value="${name}">
                ${name}
            </option>
        `;
    }


    groupFilter.innerHTML =
        html;


    if (
        [...groupFilter.options]
            .some(
                option =>
                    option.value === current
            )
    ) {

        groupFilter.value =
            current;
    }
}



/* =========================================
   SUMMARY
========================================= */

function renderSummary() {

    const registered =
        registrations.length;


    const grouped =
        Math.min(
            registered,
            GROUPED_SLOTS
        );


    const fullGroups =
        Math.floor(
            grouped /
            GROUP_CAPACITY
        );


    const reserve =
        Math.max(
            0,
            registered -
            GROUPED_SLOTS
        );


    document.getElementById(
        "registeredCount"
    ).textContent =
        registered;


    document.getElementById(
        "fullGroupCount"
    ).textContent =
        fullGroups;


    document.getElementById(
        "groupedCount"
    ).textContent =
        grouped;


    document.getElementById(
        "reserveCount"
    ).textContent =
        reserve;
}



/* =========================================
   BUILD GROUP MAP
========================================= */

function buildGroupMap() {

    const map = {};


    for (
        let index = 0;
        index < TOTAL_GROUPS;
        index++
    ) {

        map[
            getGroupName(index)
        ] = [];

    }


    const reserve = [];


    registrations.forEach(
        registration => {

            const group =
                registration.groupName;


            if (
                group &&
                map[group]
            ) {

                map[group].push(
                    registration
                );

            }

            else {

                reserve.push(
                    registration
                );

            }

        }
    );


    return {
        map,
        reserve
    };
}



/* =========================================
   RENDER GROUPS
========================================= */

function renderGroups() {

    const {
        map
    } =
        buildGroupMap();


    const filtered =
        getFilteredRegistrations();


    const filteredIds =
        new Set(
            filtered.map(
                item =>
                    item.id
            )
        );


    let html = "";


    for (
        let groupIndex = 0;
        groupIndex < TOTAL_GROUPS;
        groupIndex++
    ) {

        const name =
            getGroupName(
                groupIndex
            );


        let teams =
            map[name] || [];


        /*
           If a search/filter is being used,
           only show matching occupied slots.
        */

        const hasFilter =
            groupSearch.value.trim() ||
            groupFilter.value !== "all";


        if (
            hasFilter
        ) {

            teams =
                teams.filter(
                    team =>
                        filteredIds.has(
                            team.id
                        )
                );

        }


        if (
            groupFilter.value !== "all" &&
            groupFilter.value !== name
        ) {

            continue;

        }


        html +=
            renderGroup(
                name,
                teams
            );

    }


    if (!html) {

        html = `
            <div class="group-card">

                <div class="group-header">

                    <div class="group-name">

                        <span>
                            SEARCH
                        </span>

                        NO MATCHING TEAMS

                    </div>

                </div>

            </div>
        `;
    }


    groupsContainer.innerHTML =
        html;
}



/* =========================================
   RENDER SINGLE GROUP
========================================= */

function renderGroup(
    name,
    teams
) {

    const bySlot =
        {};


    teams.forEach(
        team => {

            const slot =
                Number(
                    team.slotNumber
                );


            if (
                slot >= 1 &&
                slot <= GROUPED_SLOTS
            ) {

                const expectedGroup =
                    getGroupName(
                        Math.floor(
                            (
                                slot - 1
                            ) /
                            GROUP_CAPACITY
                        )
                    );


                if (
                    expectedGroup ===
                    name
                ) {

                    const localSlot =
                        (
                            (
                                slot - 1
                            )
                            %
                            GROUP_CAPACITY
                        )
                        + 1;


                    bySlot[
                        localSlot
                    ] =
                        team;

                }

            }

        }
    );


    let slotsHTML = "";


    for (
        let slot = 1;
        slot <= GROUP_CAPACITY;
        slot++
    ) {

        const team =
            bySlot[slot];


        if (
            team
        ) {

            const logo =
                team.teamLogo

                    ? `
                        <img
                            src="${escapeHtml(
                                team.teamLogo
                            )}"
                            alt="Team"
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


            slotsHTML += `

                <div
                    class="team-slot occupied"
                >

                    <div
                        class="team-slot-number"
                    >
                        ${String(
                            slot
                        ).padStart(
                            2,
                            "0"
                        )}
                    </div>


                    <div
                        class="team-slot-logo"
                    >
                        ${logo}
                    </div>


                    <div
                        class="team-slot-info"
                    >

                        <strong>
                            ${escapeHtml(
                                team.teamName ||
                                "TEAM"
                            )}
                        </strong>


                        <small>
                            ${escapeHtml(
                                team.teamTag
                                    ? `TAG • ${team.teamTag}`
                                    : "REGISTERED"
                            )}
                        </small>

                    </div>

                </div>
            `;

        }

        else {

            slotsHTML += `

                <div
                    class="team-slot empty"
                >

                    <div
                        class="team-slot-number"
                    >
                        ${String(
                            slot
                        ).padStart(
                            2,
                            "0"
                        )}
                    </div>


                    <div
                        class="team-slot-logo"
                    >
                        <span>
                            —
                        </span>
                    </div>


                    <div
                        class="team-slot-info"
                    >

                        <div
                            class="empty-label"
                        >
                            AVAILABLE SLOT
                        </div>

                    </div>

                </div>
            `;
        }

    }


    const occupied =
        Object.keys(
            bySlot
        ).length;


    return `

        <article
            class="group-card"
        >

            <div
                class="group-header"
            >

                <div
                    class="group-name"
                >

                    <span>
                        SHOWDOWN • SEASON 1
                    </span>

                    ${name}

                </div>


                <div
                    class="group-count"
                >
                    ${occupied}
                    /
                    ${GROUP_CAPACITY}
                </div>

            </div>


            <div
                class="group-slots"
            >

                ${slotsHTML}

            </div>

        </article>

    `;
}



/* =========================================
   RESERVE
========================================= */

function renderReserve() {

    const {
        reserve
    } =
        buildGroupMap();


    let html = "";


    for (
        let index = 1;
        index <= RESERVE_SLOTS;
        index++
    ) {

        const absoluteSlot =
            GROUPED_SLOTS +
            index;


        const team =
            reserve.find(
                item =>
                    Number(
                        item.slotNumber
                    ) ===
                    absoluteSlot
            );


        if (
            team
        ) {

            html += `

                <div
                    class="reserve-slot"
                >

                    <strong>
                        ${absoluteSlot}
                    </strong>


                    <span>
                        ${escapeHtml(
                            team.teamName ||
                            "REGISTERED"
                        )}
                    </span>

                </div>

            `;

        }

        else {

            html += `

                <div
                    class="reserve-slot"
                >

                    <strong>
                        ${absoluteSlot}
                    </strong>


                    <span>
                        AVAILABLE
                    </span>

                </div>

            `;

        }

    }


    reserveContainer.innerHTML =
        html;
}



/* =========================================
   ESCAPE
========================================= */

function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ??
        "";


    return div.innerHTML;
}



/* =========================================
   EVENTS
========================================= */

groupSearch.addEventListener(
    "input",
    renderEverything
);


groupFilter.addEventListener(
    "change",
    renderEverything
);



/* =========================================
   AUTH CHECK
========================================= */

auth.onAuthStateChanged(
    user => {

        if (!user) {

            setStatus(
                "PLEASE LOGIN TO VIEW LIVE GROUPS.",
                true
            );

            return;
        }


        loadRegistrations();

    }
);
