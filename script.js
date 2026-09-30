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

const path = window.location.pathname;
const matchPath = path.match(/\/p\/([a-zA-Z0-9_-]+)/);
const urlParams = new URLSearchParams(window.location.search);

const profileId = matchPath ? matchPath[1] : urlParams.get('id');
const profile = profiles[profileId];

if (profile) {
    document.title = `${profile.name} | TapIN`;
    document.getElementById("profileName").textContent = profile.name;
    document.getElementById("profileBio").textContent = profile.bio;
    document.getElementById("profileImage").src = profile.image;

    if (profile.backgroundImage) {
        document.body.style.backgroundImage = `url('${profile.backgroundImage}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
    } else {
        document.body.style.background = '#f5f5f5';
    }

    const linksContainer = document.getElementById("links");
    linksContainer.innerHTML = "";

    profile.links.forEach(link => {
        const element = document.createElement("a");
        element.href = link.url;
        element.textContent = link.name;
        element.className = "profile-link";
        element.target = "_blank";
        element.rel = "noopener noreferrer";
        linksContainer.appendChild(element);
    });

} else if (window.location.pathname.includes("profile.html") || urlParams.has('id')) {
    document.querySelector(".profile-card").innerHTML = `
        <h1>Profile Not Found</h1>
        <p>Profil TapIN ini tidak ditemukan atau belum terdaftar.</p>
        <a href="index.html" class="button" style="margin-top: 20px; display:inline-block; font-size: 14px;">Kembali ke Beranda</a>
    `;
}