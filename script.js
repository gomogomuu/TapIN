const profiles = {
    "MT001": {
        name: "Mie Tiluan",
        bio: "Rasa Hebat dalam Waktu Singkat!",
        image: "images/mitiluanlg.jpg",
        backgroundImage: "images/mitiluanbg.jpg",
        links: [
            { name: "Instagram", url: "https://www.instagram.com/mietiluan" },
            { name: "TikTok", url: "https://www.tiktok.com/@mietiluan" },
            { name: "Google Review", url: "https://maps.google.com" }
        ]
    },
    "CHL002": {
        name: "Chloe the poodle",
        bio: "Mini poodle. Owned by Anastasya",
        image: "images/chloelg.jpeg",
        backgroundImage: "images/chloebg.jpg",
        links: [
            { name: "My Home", url: "https://maps.app.goo.gl/5xVG52dSYU1ZM3yh9" },
            { name: "Contack person", url: "http://wa.me/087800086395" },
        ]
    },
    "GC007": {
        name: "Geronimo Cesario",
        bio: "Binus b28 Computer Science, Bismilah space X",
        image: "images/geronimolg.jpg",
        backgroundImage: "images/geronimobg.jpg",
        links: [
            { name: "Instagram", url: "https://www.instagram.com/geronimocesario_" },
            { name: "Discord", url: "https://discord.com/users/809260801194065930" },
            { name: "Spotify", url: "https://open.spotify.com/user/rti7ssqes0dyjqozf3c3xp6tx?si=2ac3326120844f46" },
            { name: "Github", url: "https://github.com/gomogomuu" }
        ]
    },
    "FTH003": {
        name: "Fathir Khalifa",
        bio: "megan fox ex’s",
        image: "images/Fathirlg.jpeg",
        backgroundImage : "images/Fathirbg.jpeg",

        links: [
            { name: "Instagram", url: "https://www.instagram.com/fathirkhalifa?" },
            { name: "TikTok", url: "https://www.tiktok.com/@logankhalifa_?" },
            { name: "Spotify", url: "https://open.spotify.com/user/3166ewkbvykljx3l4e424in3wwvm?si=oIYmDCg3QbCI6MCoBeJsyw&utm_source=copy-link"},
            { name: "SnapChat", url: "https://www.snapchat.com/@fathir.khalifa?invite_id=LXrVg52j&locale=en_ID&share_id=DcQlAdEXTVSw7ldmBmi8Ug&sid=98056627656c44859beeef706de0f7b0"},
            { name: "soundCloud", url: " https://soundcloud.com/alfathir-khalifa?utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing"},
            { name: "Discord", url : "https://discord.com/users/599958642455740417"}
        ]
    },
    "005": {
        name: "Rumah Makan Padang Sederhana",
        bio: "Authentic Indonesian Padang Cuisine. Nikmati kelezatan rempah asli.",
        image: "https://placehold.co/150x150/dcfce7/15803d?text=Padang",
        links: [
            { name: "🌟 Berikan Google Review", url: "https://maps.google.com" },
            { name: "Daftar Menu & Harga", url: "https://google.com" },
            { name: "Reservasi WhatsApp", url: "https://wa.me/" }
        ]
    }
};

function renderProfile(profile) {
    document.title = `${profile.name} | TapIN`;
    document.getElementById("profileName").textContent = profile.name;
    document.getElementById("profileBio").textContent = profile.bio || "";
    const photo = document.getElementById("profileImage");
    photo.hidden = !profile.image;
    photo.onerror = () => { photo.hidden = true; };
    if (profile.image) photo.src = profile.image;
    document.body.style.backgroundImage = profile.backgroundImage
        ? `url(${JSON.stringify(profile.backgroundImage)})`
        : "";

    const links = document.getElementById("links");
    links.replaceChildren();
    for (const link of profile.links || []) {
        let url;
        try {
            url = new URL(link.url.trim());
        } catch {
            continue;
        }
        if (!["https:", "http:"].includes(url.protocol)) continue;
        const element = document.createElement("a");
        element.href = url.href;
        element.textContent = link.name;
        element.className = "profile-link";
        element.target = "_blank";
        element.rel = "noopener noreferrer";
        links.appendChild(element);
    }
}

const urlParams = new URLSearchParams(location.search);
const pathTag = location.pathname.match(/^\/p\/([A-Za-z0-9_-]{1,64})\/?$/)?.[1];
const profileId = pathTag || urlParams.get("id");
const demo = profileId === "001" ? profiles.FTH003 : Object.hasOwn(profiles, profileId) && profiles[profileId];

if (demo) {
    renderProfile({
        ...demo,
        image: demo.image?.replace(/^images\//, "/images/"),
        backgroundImage: demo.backgroundImage?.replace(/^images\//, "/images/")
    });
} else if (pathTag || (urlParams.get("mode") === "account" && !profileId)) {
    import("./profile-editor.js").then(({ startProfile }) => startProfile(renderProfile, pathTag)).catch(error => {
        document.getElementById("profileName").textContent = "Profil tidak dapat dibuka";
        document.getElementById("profileBio").textContent = error.message;
    });
} else {
    document.getElementById("profileName").textContent = "Profil tidak ditemukan";
    document.getElementById("profileBio").textContent = "Profil TapIN ini belum terdaftar.";
}
